using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.API.Hubs;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
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
    private readonly IHubContext<ChatHub> _hubContext;

    public MessageController(IMessageService messageService, IHubContext<ChatHub> hubContext)
    {
        _messageService = messageService;
        _hubContext = hubContext;
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _messageService.SendMessageAsync(userId, dto);

        if (result.ReceiverNotFound)
            return NotFound("Receiver not found.");

        if (dto.ChatGroupId != null)
        {
            await _hubContext.Clients.Group(dto.ChatGroupId.ToString())
                .SendAsync("ReceiveGroupMessage", userId, result.SenderName, dto.Content, result.Timestamp.ToString("o"), dto.ChatGroupId, result.GroupName);

            foreach (var notification in result.CreatedNotifications)
            {
                await _hubContext.Clients.User(notification.UserId).SendAsync("ReceiveNotification", new
                {
                    notification.Id,
                    notification.Title,
                    notification.Description,
                    Type = notification.Type.ToString().ToLower(),
                    notification.CreatedAt,
                    Meta = new { notification.SenderId, notification.ChatGroupId }
                });
            }
        }
        else if (!string.IsNullOrEmpty(dto.ReceiverId))
        {
            await _hubContext.Clients.User(dto.ReceiverId)
                .SendAsync("ReceivePrivateMessage", userId, result.SenderName, dto.Content, result.Timestamp);

            await _hubContext.Clients.User(userId)
                .SendAsync("ReceivePrivateMessage", userId, result.SenderName, dto.Content, result.Timestamp);

            var notification = result.CreatedNotifications.FirstOrDefault();
            if (notification != null)
            {
                await _hubContext.Clients.User(dto.ReceiverId).SendAsync("ReceiveNotification", new
                {
                    notification.Id,
                    notification.Title,
                    notification.Description,
                    Type = notification.Type.ToString().ToLower(),
                    notification.CreatedAt,
                    Meta = new { notification.SenderId, notification.ChatGroupId }
                });
            }
        }
        else
        {
            await _hubContext.Clients.All.SendAsync("ReceiveMessage", userId, dto.Content, result.Timestamp);
        }

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
        var group = await _messageService.CreateGroupAsync(dto);
        return Ok(group);
    }

    [HttpGet("private/{receiverId}")]
    public async Task<IActionResult> GetPrivateMessages(string receiverId, [FromQuery] PaginationParams pagination)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _messageService.GetPrivateMessagesAsync(userId, receiverId, pagination);
        return Ok(result);
    }

    [HttpGet("group/{groupId}")]
    public async Task<IActionResult> GetGroupMessages(int groupId, [FromQuery] PaginationParams pagination)
    {
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
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var groups = await _messageService.GetUserGroupsAsync(userId);
        return Ok(groups);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchMessages([FromQuery] string q, [FromQuery] PaginationParams pagination)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest("Search query is required");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _messageService.SearchMessagesAsync(userId, q, pagination);
        return Ok(result);
    }

    [HttpPut("read/private/{senderId}")]
    public async Task<IActionResult> MarkPrivateMessagesAsRead(string senderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var readMessageIds = await _messageService.MarkMessagesAsReadAsync(userId, senderId);

        if (readMessageIds.Count > 0)
        {
            await _hubContext.Clients.User(senderId)
                .SendAsync("MessagesRead", userId, readMessageIds);
        }

        return Ok(new { markedAsRead = readMessageIds.Count });
    }

    [HttpPut("read/group/{groupId}")]
    public async Task<IActionResult> MarkGroupMessagesAsRead(int groupId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var readMessageIds = await _messageService.MarkGroupMessagesAsReadAsync(userId, groupId);

        if (readMessageIds.Count > 0)
        {
            await _hubContext.Clients.Group(groupId.ToString())
                .SendAsync("GroupMessagesRead", userId, groupId, readMessageIds);
        }

        return Ok(new { markedAsRead = readMessageIds.Count });
    }
}
