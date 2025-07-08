namespace ChatApi.Models
{
    public class ChatGroupUser
    {
        public string UserId { get; set; }
        public AppUser User { get; set; }

        public int ChatGroupId { get; set; }
        public ChatGroup ChatGroup { get; set; }
    }
}
