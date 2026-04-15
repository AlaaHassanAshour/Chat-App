using ChatApp.Application.DTOs;

namespace ChatApp.Application.Interfaces;

public interface IMessageService
{
    Task<SendMessageResultDto> SendMessageAsync(string userId, SendMessageDto dto);
    Task<GroupResponseDto> CreateGroupAsync(CreateChatGroupDto dto);
    Task<PagedResult<MessageResponseDto>> GetPrivateMessagesAsync(string userId, string receiverId, PaginationParams pagination);
    Task<PagedResult<MessageResponseDto>> GetGroupMessagesAsync(int groupId, PaginationParams pagination);
    Task<PagedResult<MessageResponseDto>> GetAllMessagesAsync(PaginationParams pagination);
    Task<List<GroupResponseDto>> GetAllGroupsAsync();
    Task<List<GroupResponseDto>> GetUserGroupsAsync(string userId);
    Task<PagedResult<MessageResponseDto>> SearchMessagesAsync(string userId, string query, PaginationParams pagination);
    Task<List<int>> MarkMessagesAsReadAsync(string userId, string senderId);
    Task<List<int>> MarkGroupMessagesAsReadAsync(string userId, int groupId);
}
