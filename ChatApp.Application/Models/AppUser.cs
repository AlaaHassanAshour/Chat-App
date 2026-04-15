using Microsoft.AspNetCore.Identity;

namespace ChatApp.Application.Models;

public class AppUser : IdentityUser
{
    public ICollection<ChatGroupUser> ChatGroups { get; set; }
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
    public ICollection<ChatGroup> Groups { get; set; } = new List<ChatGroup>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
