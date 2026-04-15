namespace ChatApp.Application.DTOs;

public class MessageResponseDto
{
    public int Id { get; set; }
    public string Content { get; set; }
    public DateTime Timestamp { get; set; }
    public int? ChatGroupId { get; set; }
    public string SenderId { get; set; }
    public string? ReceiverId { get; set; }
    public string SenderName { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
