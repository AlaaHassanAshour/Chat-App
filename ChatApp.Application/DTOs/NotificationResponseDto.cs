namespace ChatApp.Application.DTOs;

public class NotificationResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Type { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public NotificationMetaDto Meta { get; set; }
}

public class NotificationMetaDto
{
    public string? SenderId { get; set; }
    public int? ChatGroupId { get; set; }
}
