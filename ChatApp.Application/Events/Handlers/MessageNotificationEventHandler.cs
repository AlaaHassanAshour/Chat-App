using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;

namespace ChatApp.Application.Events.Handlers;

public class MessageNotificationEventHandler : ILocalEventHandler<MessageSentLocalEvent>
{
    private readonly INotificationRepository _notificationRepo;

    public MessageNotificationEventHandler(INotificationRepository notificationRepo)
    {
        _notificationRepo = notificationRepo;
    }

    public async Task HandleAsync(MessageSentLocalEvent localEvent, CancellationToken cancellationToken = default)
    {
        var result = localEvent.Result;

        if (localEvent.Request.ChatGroupId.HasValue)
        {
            foreach (var memberId in result.NotifyUserIds)
            {
                var notification = await _notificationRepo.AddAsync(new Notification
                {
                    Title = "New group message",
                    Description = $"{result.SenderName} sent a message in {result.GroupName}",
                    Type = NotificationType.Info,
                    UserId = memberId,
                    SenderId = localEvent.SenderId,
                    ChatGroupId = localEvent.Request.ChatGroupId
                });

                result.CreatedNotifications.Add(notification);
            }

            return;
        }

        if (string.IsNullOrWhiteSpace(localEvent.Request.ReceiverId))
            return;

        var privateNotification = await _notificationRepo.AddAsync(new Notification
        {
            Title = "New private message",
            Description = $"{result.SenderName} sent you a message",
            Type = NotificationType.Info,
            UserId = localEvent.Request.ReceiverId,
            SenderId = localEvent.SenderId
        });

        result.CreatedNotifications.Add(privateNotification);
    }
}
