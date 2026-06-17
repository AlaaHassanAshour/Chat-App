using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;

namespace ChatApp.Application.Events.Handlers;

public class GroupNotificationEventHandler : ILocalEventHandler<GroupCreatedLocalEvent>
{
    private readonly INotificationRepository _notificationRepo;

    public GroupNotificationEventHandler(INotificationRepository notificationRepo)
    {
        _notificationRepo = notificationRepo;
    }

    public async Task HandleAsync(GroupCreatedLocalEvent localEvent, CancellationToken cancellationToken = default)
    {
        var memberIds = localEvent.MemberIds
            .Where(memberId => memberId != localEvent.OwnerId)
            .Distinct()
            .ToList();

        foreach (var memberId in memberIds)
        {
            await _notificationRepo.AddAsync(new Notification
            {
                Title = "Group invitation",
                Description = $"You have been added to group '{localEvent.GroupName}' by {localEvent.CreatorName}",
                Type = NotificationType.Info,
                UserId = memberId,
                SenderId = localEvent.OwnerId,
                ChatGroupId = localEvent.GroupId
            });
        }
    }
}
