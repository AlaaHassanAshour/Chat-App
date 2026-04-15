using ChatApp.API.Services;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.API.Hubs;

public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;
    private readonly UserConnectionManager _connectionManager;

    public ChatHub(ILogger<ChatHub> logger, UserConnectionManager connectionManager)
    {
        _logger = logger;
        _connectionManager = connectionManager;
    }

    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            _connectionManager.AddConnection(userId, Context.ConnectionId);
            await Clients.Others.SendAsync("UserOnline", userId);
        }

        _logger.LogInformation("Connected: {ConnectionId} UserId: {UserId}",
            Context.ConnectionId, Context.UserIdentifier);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            _connectionManager.RemoveConnection(userId, Context.ConnectionId);
            if (!_connectionManager.IsOnline(userId))
            {
                await Clients.Others.SendAsync("UserOffline", userId);
            }
        }

        _logger.LogInformation("Disconnected: {ConnectionId} UserId: {UserId}",
            Context.ConnectionId, Context.UserIdentifier);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task Typing(string receiverId)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Clients.User(receiverId).SendAsync("UserTyping", userId);
        }
    }

    public async Task StopTyping(string receiverId)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Clients.User(receiverId).SendAsync("UserStoppedTyping", userId);
        }
    }

    public async Task TypingInGroup(string groupName)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Clients.OthersInGroup(groupName).SendAsync("UserTypingInGroup", userId, groupName);
        }
    }

    public async Task StopTypingInGroup(string groupName)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Clients.OthersInGroup(groupName).SendAsync("UserStoppedTypingInGroup", userId, groupName);
        }
    }
}
