using Asp.Versioning;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;
using ChatApp.API.Services;
using ChatApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChatApp.API.Controllers;

[ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly UserConnectionManager _connectionManager;
    private readonly ChatAppContext _context;

    public AuthController(
        UserManager<AppUser> userManager,
        IJwtService jwtService,
        UserConnectionManager connectionManager,
        ChatAppContext context)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _connectionManager = connectionManager;
        _context = context;
    }

    [Authorize]
    [HttpGet("online-users")]
    public IActionResult GetOnlineUsers()
    {
        var onlineUserIds = _connectionManager.GetOnlineUserIds();
        return Ok(onlineUserIds);
    }

    [Authorize]
    [HttpGet("AllUsers")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users.Select(x => new
        {
            x.Id,
            x.Email,
        }).ToListAsync();
        return Ok(users);
    }

    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return Unauthorized("Invalid credentials");
        }

        var token = _jwtService.GenerateToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken(user.Id);

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            token,
            refreshToken = refreshToken.Token,
            expiresAt = refreshToken.ExpiresAt
        });
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

        if (storedToken == null || !storedToken.IsActive)
        {
            return Unauthorized("Invalid or expired refresh token");
        }

        storedToken.IsRevoked = true;

        var newAccessToken = _jwtService.GenerateToken(storedToken.User);
        var newRefreshToken = _jwtService.GenerateRefreshToken(storedToken.UserId);

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            token = newAccessToken,
            refreshToken = newRefreshToken.Token,
            expiresAt = newRefreshToken.ExpiresAt
        });
    }

    [Authorize]
    [HttpPost("revoke-token")]
    public async Task<IActionResult> RevokeToken([FromBody] RefreshTokenDto dto)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

        if (storedToken == null)
            return NotFound("Token not found");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (storedToken.UserId != userId)
            return Forbid();

        storedToken.IsRevoked = true;
        await _context.SaveChangesAsync();

        return Ok("Token revoked");
    }

    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (dto == null)
            return BadRequest("Invalid data");

        if (string.IsNullOrEmpty(dto.Email))
            return BadRequest("Email is required");

        var userExists = await _userManager.FindByEmailAsync(dto.Email);
        if (userExists != null)
        {
            return BadRequest("Email is already registered");
        }

        var user = new AppUser
        {
            Email = dto.Email,
            UserName = dto.Email,
            PhoneNumber = dto.Mobile
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { errors });
        }

        return Ok("User registered successfully");
    }
}
