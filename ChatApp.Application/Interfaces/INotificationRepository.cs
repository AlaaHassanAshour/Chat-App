using ChatApp.Application.Models;

namespace ChatApp.Application.Interfaces;

public interface INotificationRepository
{
    Task<Notification> AddAsync(Notification notification);
    Task<Notification> GetByIdAsync(int id);
    Task<List<Notification>> GetByUserAsync(string userId, int skip, int take);
    Task<int> GetCountByUserAsync(string userId);
    Task<int> GetUnreadCountByUserAsync(string userId);
    Task<List<Notification>> GetUnreadByUserAsync(string userId);
    Task<List<Notification>> GetAllByUserAsync(string userId);
    Task DeleteAsync(Notification notification);
    Task DeleteAllByUserAsync(string userId);
    Task SaveChangesAsync();
}
