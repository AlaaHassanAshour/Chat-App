namespace ChatApp.Application.Events;

public class GroupCreatedLocalEvent : ILocalEvent
{
    public GroupCreatedLocalEvent(
        int groupId,
        string groupName,
        string ownerId,
        string creatorName,
        IReadOnlyCollection<string> memberIds)
    {
        GroupId = groupId;
        GroupName = groupName;
        OwnerId = ownerId;
        CreatorName = creatorName;
        MemberIds = memberIds;
    }

    public int GroupId { get; }
    public string GroupName { get; }
    public string OwnerId { get; }
    public string CreatorName { get; }
    public IReadOnlyCollection<string> MemberIds { get; }
}
