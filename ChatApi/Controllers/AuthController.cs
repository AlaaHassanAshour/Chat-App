using ChatApi.DTOs;
using ChatApi.Models;
using ChatApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IJwtService _jwtService;

        public AuthController(UserManager<AppUser> userManager, IJwtService jwtService)
        {
            _userManager = userManager;
            _jwtService = jwtService;
        }
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
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                return Unauthorized("Invalid credentials");
            }

            var token = _jwtService.GenerateToken(user);
            return Ok(new { token });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var userExists = await _userManager.FindByEmailAsync(dto.Email);
            if (userExists != null)
            {
                return BadRequest("Email is already registered");
            }
            if (dto == null)
                return BadRequest("Invalid data");

            if (string.IsNullOrEmpty(dto.Email))
                return BadRequest("Email is required");
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

            // ممكن تضيف صلاحية (role) للمستخدم إذا بدك
            // await _userManager.AddToRoleAsync(user, "User");

            return Ok("User registered successfully");
        }
    }
}
