using ChatApp.Application.DTOs;
using ChatApp.Application.Services;
using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using ChatApp.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Tests;

public class NotificationServiceTests : IDisposable
{
    private readonly ChatAppContext _context;
    private readonly NotificationService _service;

    public NotificationServiceTests()
    {
        var options = new DbContextOptionsBuilder<ChatAppContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ChatAppContext(options);
        _service = new NotificationService(new NotificationRepository(_context));

        SeedData();
    }

    private void SeedData()
    {
        var user = new AppUser { Id = "user1", Email = "user1@test.com", UserName = "user1@test.com" };
        _context.Users.Add(user);

        _context.Notifications.AddRange(
            new Notification { Id = 1, Title = "Msg 1", Description = "Desc 1", Type = NotificationType.Info, UserId = "user1", IsRead = false },
            new Notification { Id = 2, Title = "Msg 2", Description = "Desc 2", Type = NotificationType.Success, UserId = "user1", IsRead = false },
            new Notification { Id = 3, Title = "Msg 3", Description = "Desc 3", Type = NotificationType.Warning, UserId = "user1", IsRead = true }
        );

        _context.SaveChanges();
    }

    [Fact]
    public async Task GetNotifications_ReturnsPaginatedResults()
    {
        var pagination = new PaginationParams { Page = 1, PageSize = 10 };

        var result = await _service.GetNotificationsAsync("user1", pagination);

        Assert.Equal(3, result.TotalCount);
        Assert.Equal(3, result.Items.Count);
    }

    [Fact]
    public async Task GetUnreadCount_ReturnsCorrectCount()
    {
        var count = await _service.GetUnreadCountAsync("user1");

        Assert.Equal(2, count);
    }

    [Fact]
    public async Task MarkAsRead_SingleNotification_ReturnsTrue()
    {
        var result = await _service.MarkAsReadAsync("user1", 1);

        Assert.True(result);
        var notification = await _context.Notifications.FindAsync(1);
        Assert.True(notification!.IsRead);
    }

    [Fact]
    public async Task MarkAsRead_NotFound_ReturnsFalse()
    {
        var result = await _service.MarkAsReadAsync("user1", 999);

        Assert.False(result);
    }

    [Fact]
    public async Task MarkAllAsRead_MarksAllUnread()
    {
        await _service.MarkAllAsReadAsync("user1");

        var unread = await _context.Notifications.CountAsync(n => n.UserId == "user1" && !n.IsRead);
        Assert.Equal(0, unread);
    }

    [Fact]
    public async Task DeleteNotification_ExistingNotification_ReturnsTrue()
    {
        var result = await _service.DeleteNotificationAsync("user1", 1);

        Assert.True(result);
        var exists = await _context.Notifications.AnyAsync(n => n.Id == 1);
        Assert.False(exists);
    }

    [Fact]
    public async Task DeleteNotification_NotFound_ReturnsFalse()
    {
        var result = await _service.DeleteNotificationAsync("user1", 999);

        Assert.False(result);
    }

    [Fact]
    public async Task ClearAll_RemovesAllUserNotifications()
    {
        await _service.ClearAllAsync("user1");

        var count = await _context.Notifications.CountAsync(n => n.UserId == "user1");
        Assert.Equal(0, count);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
