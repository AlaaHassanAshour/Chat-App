using ChatApp.Application.DTOs;

namespace ChatApp.Application.Events;

public class MessageSentLocalEvent : ILocalEvent
{
    public MessageSentLocalEvent(string senderId, SendMessageDto request, SendMessageResultDto result)
    {
        SenderId = senderId;
        Request = request;
        Result = result;
    }

    public string SenderId { get; }
    public SendMessageDto Request { get; }
    public SendMessageResultDto Result { get; }
}
