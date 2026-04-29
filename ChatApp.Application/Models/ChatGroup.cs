namespace ChatApp.Application.Models;

public class ChatGroup
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string OwnerId { get; set; } // منشئ المجموعة

    public ICollection<Message> Messages { get; set; }
    public ICollection<ChatGroupUser> Members { get; set; }
}
