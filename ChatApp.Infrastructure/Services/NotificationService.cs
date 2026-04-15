using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ChatAppContext _context;

    public NotificationService(ChatAppContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<NotificationResponseDto>> GetNotificationsAsync(string userId, PaginationParams pagination)
    {
        var query = _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync();

        var notifications = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(n => new NotificationResponseDto
            {
                Id = n.Id,
                Title = n.Title,
                Description = n.Description,
                Type = n.Type.ToString().ToLower(),
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                Meta = new NotificationMetaDto
                {
                    SenderId = n.SenderId,
                    ChatGroupId = n.ChatGroupId
                }
            })
            .ToListAsync();

        return new PagedResult<NotificationResponseDto>
        {
            Items = notifications,
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task<bool> MarkAsReadAsync(string userId, int notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return false;

        notification.IsRead = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<bool> DeleteNotificationAsync(string userId, int notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return false;

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task ClearAllAsync(string userId)
    {
        await _context.Notifications
            .Where(n => n.UserId == userId)
            .ExecuteDeleteAsync();
    }
}
