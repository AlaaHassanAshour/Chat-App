namespace ChatApp.Application.Models;

public class Notification
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public NotificationType Type { get; set; } = NotificationType.Info;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? SenderId { get; set; }
    public int? ChatGroupId { get; set; }

    public string UserId { get; set; }
    public AppUser User { get; set; }
}
