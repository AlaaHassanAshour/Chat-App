using ChatApp.Application.DTOs;
using ChatApp.Application.Services;
using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using ChatApp.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Tests;

public class MessageServiceTests : IDisposable
{
    private readonly ChatAppContext _context;
    private readonly MessageService _service;

    public MessageServiceTests()
    {
        var options = new DbContextOptionsBuilder<ChatAppContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ChatAppContext(options);
        _service = new MessageService(
            new MessageRepository(_context),
            new ChatGroupRepository(_context),
            new ChatGroupUserRepository(_context),
            new UserRepository(_context),
            new NotificationRepository(_context));

        SeedData();
    }

    private void SeedData()
    {
        var user1 = new AppUser { Id = "user1", Email = "user1@test.com", UserName = "user1@test.com" };
        var user2 = new AppUser { Id = "user2", Email = "user2@test.com", UserName = "user2@test.com" };
        _context.Users.AddRange(user1, user2);

        var group = new ChatGroup { Id = 1, Name = "TestGroup" };
        _context.ChatGroups.Add(group);
        _context.ChatGroupUsers.Add(new ChatGroupUser { UserId = "user1", ChatGroupId = 1 });
        _context.ChatGroupUsers.Add(new ChatGroupUser { UserId = "user2", ChatGroupId = 1 });

        _context.Messages.AddRange(
            new Message
            {
                Id = 1,
                Content = "Hello",
                SenderId = "user1",
                ReceiverId = "user2",
                Timestamp = DateTime.UtcNow.AddMinutes(-5)
            },
            new Message
            {
                Id = 2,
                Content = "Hi back",
                SenderId = "user2",
                ReceiverId = "user1",
                Timestamp = DateTime.UtcNow.AddMinutes(-3)
            },
            new Message
            {
                Id = 3,
                Content = "Group msg",
                SenderId = "user1",
                ChatGroupId = 1,
                Timestamp = DateTime.UtcNow
            });

        _context.SaveChanges();
    }

    [Fact]
    public async Task SendMessage_PrivateMessage_ReturnsResult()
    {
        var dto = new SendMessageDto { Content = "Test message", ReceiverId = "user2" };
        var result = await _service.SendMessageAsync("user1", dto);

        Assert.Equal("Test message", result.Content);
        Assert.Equal("user1", result.SenderId);
        Assert.Equal("user2", result.ReceiverId);
        Assert.False(result.ReceiverNotFound);
        Assert.Single(result.CreatedNotifications);
    }

    [Fact]
    public async Task SendMessage_ReceiverNotFound_ReturnsFlag()
    {
        var dto = new SendMessageDto { Content = "Test", ReceiverId = "nonexistent" };
        var result = await _service.SendMessageAsync("user1", dto);

        Assert.True(result.ReceiverNotFound);
        Assert.Equal(3, await _context.Messages.CountAsync());
    }

    [Fact]
    public async Task SendMessage_GroupMessage_NotifiesMembers()
    {
        var dto = new SendMessageDto { Content = "Group test", ChatGroupId = 1 };
        var result = await _service.SendMessageAsync("user1", dto);

        Assert.Equal(1, result.ChatGroupId);
        Assert.Contains("user2", result.NotifyUserIds);
        Assert.DoesNotContain("user1", result.NotifyUserIds);
        Assert.Single(result.CreatedNotifications);
        Assert.Equal("TestGroup", result.GroupName);
    }

    [Fact]
    public async Task GetPrivateMessages_ReturnsPaginatedMessages()
    {
        var pagination = new PaginationParams { Page = 1, PageSize = 10 };
        var result = await _service.GetPrivateMessagesAsync("user1", "user2", pagination);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count);
    }

    [Fact]
    public async Task GetGroupMessages_ReturnsPaginatedMessages()
    {
        var pagination = new PaginationParams { Page = 1, PageSize = 10 };
        var result = await _service.GetGroupMessagesAsync(1, pagination);

        Assert.Single(result.Items);
        Assert.Equal("Group msg", result.Items[0].Content);
    }

    [Fact]
    public async Task CreateGroup_ReturnsGroupWithMembers()
    {
        var dto = new CreateChatGroupDto { Name = "NewGroup", MemberIds = new List<string> { "user1", "user2" } };
        var result = await _service.CreateGroupAsync(dto);

        Assert.Equal("NewGroup", result.Name);
        Assert.True(result.Id > 0);
        Assert.Equal(2, _context.ChatGroupUsers.Count(x => x.ChatGroupId == result.Id));
    }

    [Fact]
    public async Task SearchMessages_FindsMatchingMessages()
    {
        var pagination = new PaginationParams { Page = 1, PageSize = 10 };
        var result = await _service.SearchMessagesAsync("user1", "Hello", pagination);

        Assert.Single(result.Items);
        Assert.Equal("Hello", result.Items[0].Content);
    }

    [Fact]
    public async Task GetUserGroups_ReturnsUserGroups()
    {
        var result = await _service.GetUserGroupsAsync("user1");

        Assert.Single(result);
        Assert.Equal("TestGroup", result[0].Name);
    }

    [Fact]
    public async Task MarkMessagesAsRead_MarksCorrectMessages()
    {
        var readIds = await _service.MarkMessagesAsReadAsync("user1", "user2");

        Assert.Single(readIds);
        var msg = await _context.Messages.FindAsync(readIds[0]);
        Assert.True(msg!.IsRead);
        Assert.NotNull(msg.ReadAt);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
