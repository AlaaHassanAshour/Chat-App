using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using ChatApp.API.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChatApp.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly ChatAppContext _context;
    private readonly IHubContext<ChatHub> _hubContext;

    public NotificationController(ChatAppContext context, IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Description,
                Type = n.Type.ToString().ToLower(),
                n.IsRead,
                n.CreatedAt,
                Meta = new
                {
                    n.SenderId,
                    n.ChatGroupId
                }
            })
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

        return NoContent();
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> ReadOne(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null)
            return NotFound();

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
