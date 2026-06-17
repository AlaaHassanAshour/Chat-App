using ChatApp.Application.DTOs;
using ChatApp.Application.Events;
using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;

namespace ChatApp.Application.Services;

public class MessageService : IMessageService
{
    private readonly IMessageRepository _repo;
    private readonly IChatGroupRepository _groupRepo;
    private readonly IChatGroupUserRepository _groupUserRepo;
    private readonly IUserRepository _userRepo;
    private readonly ILocalEventDispatcher _localEventDispatcher;

    public MessageService(
        IMessageRepository repo,
        IChatGroupRepository groupRepo,
        IChatGroupUserRepository groupUserRepo,
        IUserRepository userRepo,
        ILocalEventDispatcher localEventDispatcher)
    {
        _repo = repo;
        _groupRepo = groupRepo;
        _groupUserRepo = groupUserRepo;
        _userRepo = userRepo;
        _localEventDispatcher = localEventDispatcher;
    }

    public async Task<SendMessageResultDto> SendMessageAsync(string userId, SendMessageDto dto)
    {
        var sender = await _userRepo.GetByIdAsync(userId);
        var result = new SendMessageResultDto
        {
            Content = dto.Content,
            SenderId = userId,
            ReceiverId = dto.ReceiverId,
            ChatGroupId = dto.ChatGroupId,
            SenderName = sender?.Email ?? sender?.UserName ?? string.Empty,
            Timestamp = DateTime.UtcNow
        };

        if (!string.IsNullOrWhiteSpace(dto.ReceiverId))
        {
            var receiver = await _userRepo.GetByIdAsync(dto.ReceiverId);
            if (receiver == null)
            {
                result.ReceiverNotFound = true;
                return result;
            }
        }

        var message = new Message
        {
            Content = dto.Content,
            SenderId = userId,
            ReceiverId = dto.ReceiverId,
            ChatGroupId = dto.ChatGroupId,
            Timestamp = result.Timestamp
        };

        await _repo.AddAsync(message);

        if (dto.ChatGroupId.HasValue)
        {
            var group = await _groupRepo.GetByIdAsync(dto.ChatGroupId.Value);
            var members = await _groupUserRepo.GetByGroupIdAsync(dto.ChatGroupId.Value);
            var memberIds = members
                .Select(member => member.UserId)
                .Where(memberId => memberId != userId)
                .Distinct()
                .ToList();

            result.GroupName = group?.Name;
            result.NotifyUserIds = memberIds;
        }
        else if (!string.IsNullOrWhiteSpace(dto.ReceiverId))
        {
            result.NotifyUserIds = new List<string> { dto.ReceiverId };
        }

        await _localEventDispatcher.PublishAsync(new MessageSentLocalEvent(userId, dto, result));

        return result;
    }

    public async Task<GroupResponseDto> CreateGroupAsync(CreateChatGroupDto dto)
    {
        var ownerId = dto.MemberIds.FirstOrDefault();
        var group = await _groupRepo.AddAsync(new ChatGroup
        {
            Name = dto.Name,
            OwnerId = ownerId ?? string.Empty
        });

        var members = dto.MemberIds
            .Distinct()
            .Select(userId => new ChatGroupUser
            {
                UserId = userId,
                ChatGroupId = group.Id
            })
            .ToList();

        if (members.Count > 0)
        {
            await _groupUserRepo.AddRangeAsync(members);
        }

        var owner = string.IsNullOrWhiteSpace(ownerId) ? null : await _userRepo.GetByIdAsync(ownerId);
        var ownerName = owner?.Email ?? owner?.UserName ?? ownerId ?? string.Empty;

        await _localEventDispatcher.PublishAsync(new GroupCreatedLocalEvent(
            group.Id,
            group.Name,
            ownerId ?? string.Empty,
            ownerName,
            members.Select(member => member.UserId).ToList()));

        return new GroupResponseDto
        {
            Id = group.Id,
            Name = group.Name
        };
    }

    public async Task<PagedResult<MessageResponseDto>> GetPrivateMessagesAsync(string userId, string receiverId, PaginationParams pagination)
    {
        var skip = (pagination.Page - 1) * pagination.PageSize;
        var messages = await _repo.GetPrivateMessagesAsync(userId, receiverId, skip, pagination.PageSize);
        var totalCount = await _repo.GetPrivateMessagesCountAsync(userId, receiverId);

        return new PagedResult<MessageResponseDto>
        {
            Items = messages
                .OrderBy(message => message.Timestamp)
                .Select(MapMessage)
                .ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<MessageResponseDto>> GetGroupMessagesAsync(int groupId, PaginationParams pagination)
    {
        var skip = (pagination.Page - 1) * pagination.PageSize;
        var messages = await _repo.GetGroupMessagesAsync(groupId, skip, pagination.PageSize);
        var totalCount = await _repo.GetGroupMessagesCountAsync(groupId);

        return new PagedResult<MessageResponseDto>
        {
            Items = messages
                .OrderBy(message => message.Timestamp)
                .Select(MapMessage)
                .ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<MessageResponseDto>> GetAllMessagesAsync(PaginationParams pagination)
    {
        var skip = (pagination.Page - 1) * pagination.PageSize;
        var messages = await _repo.GetAllMessagesAsync(skip, pagination.PageSize);
        var totalCount = await _repo.GetAllMessagesCountAsync();

        return new PagedResult<MessageResponseDto>
        {
            Items = messages
                .OrderBy(message => message.Timestamp)
                .Select(MapMessage)
                .ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<List<GroupResponseDto>> GetAllGroupsAsync()
    {
        var groups = await _groupRepo.GetAllAsync();
        return groups.Select(group => new GroupResponseDto
        {
            Id = group.Id,
            Name = group.Name
        }).ToList();
    }

    public async Task<List<GroupResponseDto>> GetUserGroupsAsync(string userId)
    {
        var memberships = await _groupUserRepo.GetByUserIdAsync(userId);
        return memberships
            .Where(membership => membership.ChatGroup != null)
            .Select(membership => new GroupResponseDto
            {
                Id = membership.ChatGroup.Id,
                Name = membership.ChatGroup.Name
            })
            .ToList();
    }

    public async Task<PagedResult<MessageResponseDto>> SearchMessagesAsync(string userId, string query, PaginationParams pagination)
    {
        var skip = (pagination.Page - 1) * pagination.PageSize;
        var messages = await _repo.SearchMessagesAsync(userId, query, skip, pagination.PageSize);
        var totalCount = await _repo.SearchMessagesCountAsync(userId, query);

        return new PagedResult<MessageResponseDto>
        {
            Items = messages.Select(MapMessage).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<List<int>> MarkMessagesAsReadAsync(string userId, string senderId)
    {
        var unreadMessages = await _repo.GetUnreadPrivateMessagesAsync(userId, senderId);
        var now = DateTime.UtcNow;

        foreach (var message in unreadMessages)
        {
            message.IsRead = true;
            message.ReadAt = now;
        }

        await _repo.SaveChangesAsync();
        return unreadMessages.Select(message => message.Id).ToList();
    }

    public async Task<List<int>> MarkGroupMessagesAsReadAsync(string userId, int groupId)
    {
        var unreadMessages = await _repo.GetUnreadGroupMessagesAsync(userId, groupId);
        var now = DateTime.UtcNow;

        foreach (var message in unreadMessages)
        {
            message.IsRead = true;
            message.ReadAt = now;
        }

        await _repo.SaveChangesAsync();
        return unreadMessages.Select(message => message.Id).ToList();
    }

    public async Task<ChatGroup> GetGroupByIdAsync(int groupId)
    {
        return await _groupRepo.GetByIdAsync(groupId);
    }

    public async Task DeleteGroupAsync(int groupId)
    {
        var group = await _groupRepo.GetByIdAsync(groupId);
        if (group != null)
        {
            await _groupRepo.RemoveAsync(group);
        }
    }

    public async Task LeaveGroupAsync(string userId, int groupId)
    {
        await _groupUserRepo.RemoveUserFromGroupAsync(userId, groupId);
    }

    public async Task<GroupResponseDto> CreateGroupAsync(CreateChatGroupDto dto, string ownerId)
    {
        var group = await _groupRepo.AddAsync(new ChatGroup
        {
            Name = dto.Name,
            OwnerId = ownerId
        });

        var members = dto.MemberIds
            .Distinct()
            .Select(userId => new ChatGroupUser
            {
                UserId = userId,
                ChatGroupId = group.Id
            })
            .ToList();

        if (members.Count > 0)
        {
            await _groupUserRepo.AddRangeAsync(members);
        }

        var owner = await _userRepo.GetByIdAsync(ownerId);
        var ownerName = owner?.Email ?? owner?.UserName ?? ownerId;

        await _localEventDispatcher.PublishAsync(new GroupCreatedLocalEvent(
            group.Id,
            group.Name,
            ownerId,
            ownerName,
            members.Select(member => member.UserId).ToList()));

        return new GroupResponseDto
        {
            Id = group.Id,
            Name = group.Name
        };
    }

    private static MessageResponseDto MapMessage(Message message)
    {
        return new MessageResponseDto
        {
            Id = message.Id,
            Content = message.Content,
            Timestamp = message.Timestamp,
            ChatGroupId = message.ChatGroupId,
            SenderId = message.SenderId,
            ReceiverId = message.ReceiverId,
            SenderName = message.Sender?.Email ?? message.Sender?.UserName ?? string.Empty,
            IsRead = message.IsRead,
            ReadAt = message.ReadAt
        };
    }
}
