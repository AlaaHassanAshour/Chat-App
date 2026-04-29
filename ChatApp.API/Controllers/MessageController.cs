using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.API.Services;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ChatApp.API.Controllers;

[ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/[controller]")]
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly IMessageRealtimeNotifier _messageRealtimeNotifier;
    private readonly IUserRepository _userRepository; // إضافة IUserRepository
    private readonly IChatGroupUserRepository _groupUserRepo; // إضافة IChatGroupUserRepository

    public MessageController(IMessageService messageService, IMessageRealtimeNotifier messageRealtimeNotifier, IUserRepository userRepository, IChatGroupUserRepository groupUserRepo)
    {
        _messageService = messageService;
        _messageRealtimeNotifier = messageRealtimeNotifier;
        _userRepository = userRepository; // تهيئة IUserRepository
        _groupUserRepo = groupUserRepo; // تهيئة IChatGroupUserRepository   
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        var userId = GetRequiredUserId();
        if (userId == null)
            return Unauthorized("User identifier is missing.");

        var result = await _messageService.SendMessageAsync(userId, dto);

        if (result.ReceiverNotFound)
            return NotFound("Receiver not found.");

        await _messageRealtimeNotifier.NotifyMessageSentAsync(userId, dto, result);

        return Ok(new
        {
            result.Content,
            result.SenderId,
            result.ReceiverId,
            result.ChatGroupId,
            result.SenderName,
        });
    }

    [HttpPost("groups")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateChatGroupDto dto)
    {
        var userId = GetRequiredUserId();
        if (userId == null)
            return Unauthorized("User identifier is missing.");

        // أضف المنشئ لقائمة الأعضاء إذا لم يكن موجوداً
        if (!dto.MemberIds.Contains(userId))
            dto.MemberIds.Insert(0, userId);

        var group = await _messageService.CreateGroupAsync(dto, userId);

        // جلب اسم المنشئ
        var user = await _userRepository.GetByIdAsync(userId);
        var creatorName = user?.Email ?? user?.UserName ?? userId;

        // إرسال إشعار SignalR مع اسم المنشئ
        await _messageRealtimeNotifier.NotifyGroupInvitationAsync(
            group.Id,
            group.Name,
            creatorName,
            dto.MemberIds.Distinct().ToList()
        );

        return Ok(group);
    }

    [HttpGet("private/{receiverId}")]
    public async Task<IActionResult> GetPrivateMessages(string receiverId, [FromQuery] PaginationParams pagination)
    {
        var userId = GetRequiredUserId();
        if (userId == null)
            return Unauthorized("User identifier is missing.");

        var result = await _messageService.GetPrivateMessagesAsync(userId, receiverId, pagination);
        return Ok(result);
    }

    [HttpGet("group/{groupId}")]
    public async Task<IActionResult> GetGroupMessages(int groupId, [FromQuery] PaginationParams pagination)
    {
        // احصل على معرف المستخدم الحالي (حسب طريقة المصادقة لديك)
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        // تحقق أن المستخدم عضو في المجموعة
        var isMember = await _groupUserRepo.IsUserInGroupAsync(userId, groupId);
        if (!isMember)
            return Forbid();

        var result = await _messageService.GetGroupMessagesAsync(groupId, pagination);
        return Ok(result);
    }

    [HttpGet("Messages")]
    public async Task<IActionResult> GetAllMessages([FromQuery] PaginationParams pagination)
    {
        var result = await _messageService.GetAllMessagesAsync(pagination);
        return Ok(result);
    }

    [ResponseCache(Duration = 30)]
    [HttpGet("groups")]
    public async Task<IActionResult> GetAllGroups()
    {
        var groups = await _messageService.GetAllGroupsAsync();
        return Ok(groups);
    }

    [HttpGet("groupsUser")]
    public async Task<IActionResult> GetUserGroups()
    {
        var userId = GetRequiredUserId();
        if (userId == null)
            return Unauthorized("User identifier is missing.");

        var groups = await _messageService.GetUserGroupsAsync(userId);
        return Ok(groups);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchMessages([FromQuery] string q, [FromQuery] PaginationParams pagination)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest("Search query is required");

        var userId = GetRequiredUserId();
        if (userId == null)
            return Unauthorized("User identifier is missing.");

        var result = await _messageService.SearchMessagesAsync(userId, q, pagination);
        return Ok(result);
    }

    [HttpPut("read/private/{senderId}")]
    public async Task<IActionResult> MarkPrivateMessagesAsRead(string senderId)
    {
        var userId = GetRequiredUserId();
        if (userId == null)
            return Unauthorized("User identifier is missing.");

        var readMessageIds = await _messageService.MarkMessagesAsReadAsync(userId, senderId);
        await _messageRealtimeNotifier.NotifyPrivateMessagesReadAsync(userId, senderId, readMessageIds);

        return Ok(new { markedAsRead = readMessageIds.Count });
    }

    [HttpPut("read/group/{groupId}")]
    public async Task<IActionResult> MarkGroupMessagesAsRead(int groupId)
    {
        var userId = GetRequiredUserId();
        if (userId == null)
            return Unauthorized("User identifier is missing.");

        var readMessageIds = await _messageService.MarkGroupMessagesAsReadAsync(userId, groupId);
        await _messageRealtimeNotifier.NotifyGroupMessagesReadAsync(userId, groupId, readMessageIds);

        return Ok(new { markedAsRead = readMessageIds.Count });
    }

    [HttpDelete("group/{groupId}")]
    public async Task<IActionResult> DeleteGroup(int groupId)
    {
        var userId = GetRequiredUserId();
        if (userId == null)
            return Unauthorized("User identifier is missing.");

        var group = await _messageService.GetGroupByIdAsync(groupId);
        if (group == null)
            return NotFound();

        if (group.OwnerId != userId)
            return Forbid();

        await _messageService.DeleteGroupAsync(groupId);
        return NoContent();
    }

    [HttpPost("group/{groupId}/leave")]
    public async Task<IActionResult> LeaveGroup(int groupId)
    {
        var userId = GetRequiredUserId();
        if (userId == null)
            return Unauthorized("User identifier is missing.");

        await _messageService.LeaveGroupAsync(userId, groupId);
        return NoContent();
    }

    private string? GetRequiredUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}
