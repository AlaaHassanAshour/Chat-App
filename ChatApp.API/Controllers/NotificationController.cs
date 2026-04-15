using Asp.Versioning;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ChatApp.API.Controllers;

[ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] PaginationParams pagination)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _notificationService.GetNotificationsAsync(userId, pagination);
        return Ok(result);
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _notificationService.MarkAllAsReadAsync(userId);
        return NoContent();
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> ReadOne(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var success = await _notificationService.MarkAsReadAsync(userId, id);
        return success ? NoContent() : NotFound();
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { unreadCount = count });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var success = await _notificationService.DeleteNotificationAsync(userId, id);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAll()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _notificationService.ClearAllAsync(userId);
        return NoContent();
    }
}
