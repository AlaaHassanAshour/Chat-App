using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Services;

public class MessageService : IMessageService
{
    private readonly ChatAppContext _context;

    public MessageService(ChatAppContext context)
    {
        _context = context;
    }

    public async Task<SendMessageResultDto> SendMessageAsync(string userId, SendMessageDto dto)
    {
        var sender = await _context.Users.FindAsync(userId);
        var message = new Message
        {
            Content = dto.Content,
            SenderId = userId,
            Timestamp = DateTime.UtcNow,
            ChatGroupId = dto.ChatGroupId,
            ReceiverId = dto.ReceiverId
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        var result = new SendMessageResultDto
        {
            Content = message.Content,
            SenderId = message.SenderId,
            ReceiverId = message.ReceiverId,
            ChatGroupId = message.ChatGroupId,
            SenderName = sender?.Email,
            Timestamp = message.Timestamp
        };

        if (dto.ChatGroupId != null)
        {
            var memberIds = await _context.ChatGroupUsers
                .Where(gu => gu.ChatGroupId == dto.ChatGroupId && gu.UserId != userId)
                .Select(gu => gu.UserId)
                .ToListAsync();

            var group = await _context.ChatGroups.FindAsync(dto.ChatGroupId);
            result.GroupName = group?.Name;
            result.NotifyUserIds = memberIds;

            var notifications = memberIds.Select(memberId => new Notification
            {
                Title = "New group message",
                Description = $"{sender?.Email} sent a message in {group?.Name}",
                Type = NotificationType.Info,
                UserId = memberId,
                SenderId = userId,
                ChatGroupId = dto.ChatGroupId
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
            result.CreatedNotifications = notifications;
        }
        else if (!string.IsNullOrEmpty(dto.ReceiverId))
        {
            var receiver = await _context.Users.FindAsync(dto.ReceiverId);
            if (receiver == null)
            {
                result.ReceiverNotFound = true;
                return result;
            }

            result.NotifyUserIds = new List<string> { dto.ReceiverId };

            var notification = new Notification
            {
                Title = "New private message",
                Description = $"{sender?.Email} sent you a message",
                Type = NotificationType.Info,
                UserId = dto.ReceiverId,
                SenderId = userId
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            result.CreatedNotifications = new List<Notification> { notification };
        }

        return result;
    }

    public async Task<GroupResponseDto> CreateGroupAsync(CreateChatGroupDto dto)
    {
        var group = new ChatGroup { Name = dto.Name };
        _context.ChatGroups.Add(group);
        await _context.SaveChangesAsync();

        var members = dto.MemberIds.Select(userId => new ChatGroupUser
        {
            UserId = userId,
            ChatGroupId = group.Id
        }).ToList();

        _context.ChatGroupUsers.AddRange(members);
        await _context.SaveChangesAsync();

        return new GroupResponseDto { Id = group.Id, Name = group.Name };
    }

    public async Task<PagedResult<MessageResponseDto>> GetPrivateMessagesAsync(string userId, string receiverId, PaginationParams pagination)
    {
        var query = _context.Messages
            .Where(m =>
                (m.SenderId == userId && m.ReceiverId == receiverId) ||
                (m.SenderId == receiverId && m.ReceiverId == userId))
            .OrderByDescending(m => m.Timestamp);

        var totalCount = await query.CountAsync();

        var messages = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(x => new MessageResponseDto
            {
                Id = x.Id,
                Content = x.Content,
                Timestamp = x.Timestamp,
                ChatGroupId = x.ChatGroupId,
                SenderId = x.SenderId,
                SenderName = x.Sender.Email,
                IsRead = x.IsRead,
                ReadAt = x.ReadAt,
            })
            .ToListAsync();

        return new PagedResult<MessageResponseDto>
        {
            Items = messages,
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<MessageResponseDto>> GetGroupMessagesAsync(int groupId, PaginationParams pagination)
    {
        var query = _context.Messages
            .Where(m => m.ChatGroupId == groupId)
            .OrderByDescending(m => m.Timestamp);

        var totalCount = await query.CountAsync();

        var messages = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(x => new MessageResponseDto
            {
                Id = x.Id,
                Content = x.Content,
                Timestamp = x.Timestamp,
                ChatGroupId = x.ChatGroupId,
                SenderId = x.SenderId,
                SenderName = x.Sender.Email,
                IsRead = x.IsRead,
                ReadAt = x.ReadAt,
            })
            .ToListAsync();

        return new PagedResult<MessageResponseDto>
        {
            Items = messages,
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<MessageResponseDto>> GetAllMessagesAsync(PaginationParams pagination)
    {
        var query = _context.Messages.OrderByDescending(x => x.Timestamp);

        var totalCount = await query.CountAsync();

        var messages = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(x => new MessageResponseDto
            {
                Id = x.Id,
                Content = x.Content,
                Timestamp = x.Timestamp,
                ChatGroupId = x.ChatGroupId,
                SenderId = x.SenderId,
                ReceiverId = x.ReceiverId,
                SenderName = x.Sender.Email,
                IsRead = x.IsRead,
                ReadAt = x.ReadAt,
            })
            .ToListAsync();

        return new PagedResult<MessageResponseDto>
        {
            Items = messages,
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<List<GroupResponseDto>> GetAllGroupsAsync()
    {
        return await _context.ChatGroups
            .Select(g => new GroupResponseDto { Id = g.Id, Name = g.Name })
            .ToListAsync();
    }

    public async Task<List<GroupResponseDto>> GetUserGroupsAsync(string userId)
    {
        return await _context.ChatGroupUsers
            .Where(gm => gm.UserId == userId)
            .Select(gm => new GroupResponseDto
            {
                Id = gm.ChatGroup.Id,
                Name = gm.ChatGroup.Name
            })
            .ToListAsync();
    }

    public async Task<PagedResult<MessageResponseDto>> SearchMessagesAsync(string userId, string query, PaginationParams pagination)
    {
        var dbQuery = _context.Messages
            .Where(m => (m.SenderId == userId || m.ReceiverId == userId) &&
                        m.Content.Contains(query))
            .OrderByDescending(m => m.Timestamp);

        var totalCount = await dbQuery.CountAsync();

        var messages = await dbQuery
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(x => new MessageResponseDto
            {
                Id = x.Id,
                Content = x.Content,
                Timestamp = x.Timestamp,
                ChatGroupId = x.ChatGroupId,
                SenderId = x.SenderId,
                ReceiverId = x.ReceiverId,
                SenderName = x.Sender.Email,
                IsRead = x.IsRead,
                ReadAt = x.ReadAt,
            })
            .ToListAsync();

        return new PagedResult<MessageResponseDto>
        {
            Items = messages,
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<List<int>> MarkMessagesAsReadAsync(string userId, string senderId)
    {
        var now = DateTime.UtcNow;
        var unreadMessages = await _context.Messages
            .Where(m => m.SenderId == senderId && m.ReceiverId == userId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in unreadMessages)
        {
            msg.IsRead = true;
            msg.ReadAt = now;
        }

        await _context.SaveChangesAsync();
        return unreadMessages.Select(m => m.Id).ToList();
    }

    public async Task<List<int>> MarkGroupMessagesAsReadAsync(string userId, int groupId)
    {
        var now = DateTime.UtcNow;
        var unreadMessages = await _context.Messages
            .Where(m => m.ChatGroupId == groupId && m.SenderId != userId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in unreadMessages)
        {
            msg.IsRead = true;
            msg.ReadAt = now;
        }

        await _context.SaveChangesAsync();
        return unreadMessages.Select(m => m.Id).ToList();
    }
}
