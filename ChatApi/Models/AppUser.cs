using Microsoft.AspNetCore.Identity;

namespace ChatApi.Models
{
    public class AppUser : IdentityUser
    {
               public ICollection<Message> Messages { get; set; }
        public ICollection<ChatGroupUser> ChatGroups { get; set; }
        // المجموعات التي ينتمي لها المستخدم
        // الرسائل المرسلة
        public ICollection<Message> SentMessages { get; set; } = new List<Message>();

        // الرسائل المستلمة (لو محادثة فردية)
        public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();

        public ICollection<ChatGroup> Groups { get; set; } = new List<ChatGroup>();
    }
}
