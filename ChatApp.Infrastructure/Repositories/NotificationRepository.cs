using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ChatAppContext _context;
    public NotificationRepository(ChatAppContext context) => _context = context;

    public async Task<Notification> AddAsync(Notification notification)
    {
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        return notification;
    }
 

    public async Task<Notification> GetByIdAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null) {
            return null;
        }
        return notification;
    }
    public async Task<List<Notification>> GetByUserAsync(string userId, int skip, int take)
        => await _context.Notifications.Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).Skip(skip).Take(take).ToListAsync();

    public async Task<int> GetCountByUserAsync(string userId)
        => await _context.Notifications.CountAsync(n => n.UserId == userId);

    public async Task<int> GetUnreadCountByUserAsync(string userId)
        => await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

    public async Task<List<Notification>> GetUnreadByUserAsync(string userId)
        => await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();

    public async Task<List<Notification>> GetAllByUserAsync(string userId)
        => await _context.Notifications.Where(n => n.UserId == userId).ToListAsync();

    public async Task DeleteAsync(Notification notification)
    {
        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAllByUserAsync(string userId)
    {
        var notifications = await _context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();

    public async Task<List<Notification>> AddRangeAsync(List<Notification> notifications)
    {
        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();
        return notifications;
    }
}
