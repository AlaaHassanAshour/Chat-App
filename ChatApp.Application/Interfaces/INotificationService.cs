using ChatApp.Application.DTOs;

namespace ChatApp.Application.Interfaces;

public interface INotificationService
{
    Task<PagedResult<NotificationResponseDto>> GetNotificationsAsync(string userId, PaginationParams pagination);
    Task MarkAllAsReadAsync(string userId);
    Task<bool> MarkAsReadAsync(string userId, int notificationId);
    Task<int> GetUnreadCountAsync(string userId);
    Task<bool> DeleteNotificationAsync(string userId, int notificationId);
    Task ClearAllAsync(string userId);
}
