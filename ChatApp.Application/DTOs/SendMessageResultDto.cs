using ChatApp.Application.Models;

namespace ChatApp.Application.DTOs;

public class SendMessageResultDto
{
    public string Content { get; set; }
    public string SenderId { get; set; }
    public string? ReceiverId { get; set; }
    public int? ChatGroupId { get; set; }
    public string SenderName { get; set; }
    public DateTime Timestamp { get; set; }
    public List<Notification> CreatedNotifications { get; set; } = new();
    public List<string> NotifyUserIds { get; set; } = new();
    public string? GroupName { get; set; }
    public bool ReceiverNotFound { get; set; }
}
