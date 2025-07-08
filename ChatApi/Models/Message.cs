namespace ChatApi.Models
{
    public class Message
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public string SenderId { get; set; }
        public AppUser Sender { get; set; }

        public int? ChatGroupId { get; set; }
        public ChatGroup ChatGroup { get; set; }

        public string? ReceiverId { get; set; } // لمحادثات الفردية
        public AppUser Receiver { get; set; }
    }
}
