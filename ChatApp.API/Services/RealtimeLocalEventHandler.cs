using ChatApp.Application.Events;

namespace ChatApp.API.Services;

public class RealtimeLocalEventHandler :
    ILocalEventHandler<MessageSentLocalEvent>,
    ILocalEventHandler<GroupCreatedLocalEvent>
{
    private readonly IMessageRealtimeNotifier _messageRealtimeNotifier;

    public RealtimeLocalEventHandler(IMessageRealtimeNotifier messageRealtimeNotifier)
    {
        _messageRealtimeNotifier = messageRealtimeNotifier;
    }

    public async Task HandleAsync(MessageSentLocalEvent localEvent, CancellationToken cancellationToken = default)
    {
        await _messageRealtimeNotifier.NotifyMessageSentAsync(
            localEvent.SenderId,
            localEvent.Request,
            localEvent.Result);
    }

    public async Task HandleAsync(GroupCreatedLocalEvent localEvent, CancellationToken cancellationToken = default)
    {
        await _messageRealtimeNotifier.NotifyGroupInvitationAsync(
            localEvent.GroupId,
            localEvent.GroupName,
            localEvent.CreatorName,
            localEvent.MemberIds.ToList());
    }
}
