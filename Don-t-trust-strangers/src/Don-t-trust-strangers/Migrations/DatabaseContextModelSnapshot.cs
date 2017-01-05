using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Don_t_trust_strangers.DataAccess;
using Don_t_trust_strangers.Enums;

namespace Donttruststrangers.Migrations
{
    [DbContext(typeof(DatabaseContext))]
    partial class DatabaseContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder
                .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.SerialColumn)
                .HasAnnotation("ProductVersion", "1.1.0-rtm-22752");

            modelBuilder.Entity("Don_t_trust_strangers.Models.Conversation", b =>
                {
                    b.Property<long>("ConversationId")
                        .ValueGeneratedOnAdd();

                    b.Property<DateTime>("Timestamp");

                    b.Property<DateTime>("UpdatedTimestamp");

                    b.HasKey("ConversationId");

                    b.ToTable("Conversations");
                });

            modelBuilder.Entity("Don_t_trust_strangers.Models.Message", b =>
                {
                    b.Property<long>("MessageId")
                        .ValueGeneratedOnAdd();

                    b.Property<string>("Content");

                    b.Property<long>("ConversationId");

                    b.Property<long>("PersonId");

                    b.Property<DateTime>("Timestamp");

                    b.Property<int>("Type");

                    b.Property<DateTime>("UpdatedTimestamp");

                    b.HasKey("MessageId");

                    b.HasIndex("ConversationId");

                    b.ToTable("Messages");
                });

            modelBuilder.Entity("Don_t_trust_strangers.Models.Message", b =>
                {
                    b.HasOne("Don_t_trust_strangers.Models.Conversation", "Conversation")
                        .WithMany("Messages")
                        .HasForeignKey("ConversationId")
                        .OnDelete(DeleteBehavior.Cascade);
                });
        }
    }
}
