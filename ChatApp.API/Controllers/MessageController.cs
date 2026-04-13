using ChatApp.Application.DTOs;
using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using ChatApp.API.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChatApp.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly ChatAppContext _context;
    private readonly IHubContext<ChatHub> _hubContext;

    public MessageController(ChatAppContext context, IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
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

        if (dto.ChatGroupId != null)
        {
            var groupName = dto.ChatGroupId.ToString();
            await _hubContext.Clients.Group(groupName).SendAsync("ReceiveGroupMessage", userId, sender?.Email, dto.Content, message.Timestamp.ToString("o"));
        }
        else if (!string.IsNullOrEmpty(dto.ReceiverId))
        {
            var receiver = await _context.Users.FindAsync(dto.ReceiverId);
            if (receiver == null)
            {
                return NotFound("Receiver not found.");
            }

            await _hubContext.Clients.User(dto.ReceiverId)
                             .SendAsync("ReceivePrivateMessage",
                                        userId,
                                        sender?.Email,
                                        dto.Content,
                                        message.Timestamp);

            await _hubContext.Clients.User(userId)
                             .SendAsync("ReceivePrivateMessage",
                                        userId,
                                        sender?.Email,
                                        dto.Content,
                                        message.Timestamp);
        }
        else
        {
            await _hubContext.Clients.All.SendAsync("ReceiveMessage", userId, dto.Content, message.Timestamp);
        }

        return Ok(new
        {
            message.Content,
            message.SenderId,
            message.ReceiverId,
            message.ChatGroupId,
            SenderName = sender?.Email,
        });
    }

    [HttpPost("groups")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateChatGroupDto dto)
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

        return Ok(new { group.Id, group.Name });
    }

    [HttpGet("private/{receiverId}")]
    public async Task<IActionResult> GetPrivateMessages(string receiverId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var messages = await _context.Messages
            .Where(m =>
                (m.SenderId == userId && m.ReceiverId == receiverId) ||
                (m.SenderId == receiverId && m.ReceiverId == userId))
            .Select(x => new
            {
                x.Id,
                x.Content,
                x.Timestamp,
                x.ChatGroupId,
                x.SenderId,
                SenderName = x.Sender.Email,
            })
            .OrderBy(m => m.Timestamp)
            .ToListAsync();

        return Ok(messages);
    }

    [HttpGet("group/{groupId}")]
    public async Task<IActionResult> GetGroupMessages(int groupId)
    {
        var messages = await _context.Messages
            .Where(m => m.ChatGroupId == groupId)
            .Select(x => new
            {
                x.Id,
                x.Content,
                x.Timestamp,
                x.ChatGroupId,
                x.SenderId,
                SenderName = x.Sender.Email,
            })
            .OrderBy(m => m.Timestamp)
            .ToListAsync();

        return Ok(messages);
    }

    [HttpGet("Messages")]
    public async Task<IActionResult> GetGroups()
    {
        var messages = await _context.Messages.OrderByDescending(x => x.Timestamp)
            .ToListAsync();
        return Ok(messages);
    }

    [HttpGet("groubs")]
    public async Task<IActionResult> Getgroubs()
    {
        var messages = await _context.ChatGroups.ToListAsync();
        return Ok(messages);
    }

    [HttpGet("groupsUser")]
    public async Task<IActionResult> GetUserGroups()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var groups = await _context.ChatGroupUsers
            .Where(gm => gm.UserId == userId)
            .Include(gm => gm.ChatGroup)
            .Select(gm => new
            {
                gm.ChatGroup.Id,
                gm.ChatGroup.Name
            })
            .ToListAsync();

        return Ok(groups);
    }
}
