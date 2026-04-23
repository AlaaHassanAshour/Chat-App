using ChatApp.Application.DTOs;

namespace ChatApp.API.Services;

public interface IMessageRealtimeNotifier
{
    Task NotifyMessageSentAsync(string senderId, SendMessageDto request, SendMessageResultDto result);
    Task NotifyPrivateMessagesReadAsync(string readerUserId, string senderId, IReadOnlyCollection<int> readMessageIds);
    Task NotifyGroupMessagesReadAsync(string readerUserId, int groupId, IReadOnlyCollection<int> readMessageIds);
}
