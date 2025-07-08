using ChatApi.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ChatApi.Data;

public class ChatAppContext : IdentityDbContext<AppUser>
{
    public ChatAppContext(DbContextOptions<ChatAppContext> options) : base(options) { }

    public DbSet<Message> Messages { get; set; }
    public DbSet<ChatGroup> ChatGroups { get; set; }
    public DbSet<ChatGroupUser> ChatGroupUsers { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);


        builder.Entity<ChatGroupUser>()
      .HasKey(cg => new { cg.ChatGroupId, cg.UserId }); // المفتاح المركب

        builder.Entity<ChatGroupUser>()
    .HasOne(cg => cg.User)
    .WithMany(u => u.ChatGroups)
    .HasForeignKey(cg => cg.UserId);

        builder.Entity<ChatGroupUser>()
            .HasOne(cg => cg.ChatGroup)
            .WithMany(g => g.Members)
            .HasForeignKey(cg => cg.ChatGroupId);
        // العلاقة بين الرسائل والمجموعة
        builder.Entity<Message>()
        .HasOne(m => m.ChatGroup)
        .WithMany(g => g.Messages)
        .HasForeignKey(m => m.ChatGroupId)
        .OnDelete(DeleteBehavior.Cascade);

    // العلاقة بين الرسائل والمرسل
    builder.Entity<Message>()
        .HasOne(m => m.Sender)
        .WithMany(u => u.SentMessages)
        .HasForeignKey(m => m.SenderId)
        .OnDelete(DeleteBehavior.NoAction);

    // العلاقة بين الرسائل والمستقبل (لو فردي)
    builder.Entity<Message>()
        .HasOne(m => m.Receiver)
        .WithMany(u => u.ReceivedMessages)
        .HasForeignKey(m => m.ReceiverId)
        .OnDelete(DeleteBehavior.NoAction);



    }
}