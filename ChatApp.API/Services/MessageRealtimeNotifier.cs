using ChatApp.API.Hubs;
using ChatApp.Application.DTOs;
using ChatApp.Application.Models;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.API.Services;

public class MessageRealtimeNotifier : IMessageRealtimeNotifier
{
    private readonly IHubContext<ChatHub> _hubContext;

    public MessageRealtimeNotifier(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyMessageSentAsync(string senderId, SendMessageDto request, SendMessageResultDto result)
    {
        if (request.ChatGroupId.HasValue)
        {
            await NotifyGroupMessageSentAsync(senderId, request.ChatGroupId.Value, result);
            return;
        }

        if (!string.IsNullOrWhiteSpace(request.ReceiverId))
        {
            await NotifyPrivateMessageSentAsync(senderId, request.ReceiverId, result);
            return;
        }

        await _hubContext.Clients.All.SendAsync("ReceiveMessage", senderId, result.Content, result.Timestamp);
    }

    public async Task NotifyPrivateMessagesReadAsync(string readerUserId, string senderId, IReadOnlyCollection<int> readMessageIds)
    {
        if (readMessageIds.Count == 0)
            return;

        await _hubContext.Clients.User(senderId)
            .SendAsync("MessagesRead", readerUserId, readMessageIds);
    }

    public async Task NotifyGroupMessagesReadAsync(string readerUserId, int groupId, IReadOnlyCollection<int> readMessageIds)
    {
        if (readMessageIds.Count == 0)
            return;

        await _hubContext.Clients.Group(groupId.ToString())
            .SendAsync("GroupMessagesRead", readerUserId, groupId, readMessageIds);
    }

    public async Task NotifyGroupInvitationAsync(int groupId, string groupName, string creatorName, List<string> memberIds)
    {
        foreach (var memberId in memberIds)
        {
            if (memberId == creatorName) // استثناء منشئ المجموعة من تلقي دعوة المجموعة
                continue;

            await _hubContext.Clients.User(memberId).SendAsync(
                "ReceiveNotification",
                new
                {
                    Title = "Group invitation",
                    Description = $"You have been added to group '{groupName}' by {creatorName}",
                    Type = "info",
                    ChatGroupId = groupId,
                    SenderName = creatorName,
                    CreatedAt = DateTime.UtcNow
                });
        }
    }

    private async Task NotifyGroupMessageSentAsync(string senderId, int groupId, SendMessageResultDto result)
    {
        await _hubContext.Clients.Group(groupId.ToString())
            .SendAsync(
                "ReceiveGroupMessage",
                senderId,
                result.SenderName,
                result.Content,
                result.Timestamp.ToString("o"),
                result.ChatGroupId,
                result.GroupName
            );

        foreach (var notification in result.CreatedNotifications)
        {
            await _hubContext.Clients.User(notification.UserId).SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.Title,
                notification.Description,
                Type = notification.Type.ToString().ToLower(),
                notification.CreatedAt,
                Meta = new { notification.SenderId, notification.ChatGroupId }
            });
        }
    }

    private async Task NotifyPrivateMessageSentAsync(string senderId, string receiverId, SendMessageResultDto result)
    {
        await _hubContext.Clients.User(receiverId)
            .SendAsync("ReceivePrivateMessage", senderId, result.SenderName, result.Content, result.Timestamp);

        await _hubContext.Clients.User(senderId)
            .SendAsync("ReceivePrivateMessage", senderId, result.SenderName, result.Content, result.Timestamp);

        var notification = result.CreatedNotifications.FirstOrDefault();
        if (notification != null)
        {
            await _hubContext.Clients.User(receiverId).SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.Title,
                notification.Description,
                Type = notification.Type.ToString().ToLower(),
                notification.CreatedAt,
                Meta = new { notification.SenderId, notification.ChatGroupId }
            });
        }
    }
}
