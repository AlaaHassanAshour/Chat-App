using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;

namespace ChatApp.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    public NotificationService(INotificationRepository repo) => _repo = repo;

    public async Task<PagedResult<NotificationResponseDto>> GetNotificationsAsync(string userId, PaginationParams pagination)
    {
        var notifications = await _repo.GetByUserAsync(userId, (pagination.Page - 1) * pagination.PageSize, pagination.PageSize);
        var totalCount = await _repo.GetCountByUserAsync(userId);
        var items = notifications.Select(n => new NotificationResponseDto
        {
            Id = n.Id,
            Title = n.Title,
            Description = n.Description,
            Type = n.Type.ToString().ToLower(),
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            Meta = new NotificationMetaDto { SenderId = n.SenderId, ChatGroupId = n.ChatGroupId }
        }).ToList();
        return new PagedResult<NotificationResponseDto> { Items = items, TotalCount = totalCount, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        var unread = await _repo.GetUnreadByUserAsync(userId);
        foreach (var n in unread)
            n.IsRead = true;
        await _repo.SaveChangesAsync();
    }

    public async Task<bool> MarkAsReadAsync(string userId, int notificationId)
    {
        var notification = await _repo.GetByIdAsync(notificationId);
        if (notification == null || notification.UserId != userId) return false;
        notification.IsRead = true;
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetUnreadCountAsync(string userId)
        => await _repo.GetUnreadCountByUserAsync(userId);

    public async Task<bool> DeleteNotificationAsync(string userId, int notificationId)
    {
        var notification = await _repo.GetByIdAsync(notificationId);
        if (notification == null || notification.UserId != userId) return false;
        await _repo.DeleteAsync(notification);
        return true;
    }

    public async Task ClearAllAsync(string userId)
        => await _repo.DeleteAllByUserAsync(userId);
}
