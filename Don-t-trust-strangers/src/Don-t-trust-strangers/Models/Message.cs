using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Don_t_trust_strangers.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Don_t_trust_strangers.Models
{
    public class Message
    {
        public Message()
        {
            Timestamp = DateTime.Now;
        }

        public Message(MessageType type, string content)
        {
            Type = type;
            Content = content;
            Timestamp = DateTime.Now;
        }

        [Key]
        public long MessageId { get; set; }
        public long PersonId { get; set; }
        public DateTime Timestamp { get; set; }
        public MessageType Type { get; set; }
        public string Content { get; set; }
        [ForeignKey("ConversationId")]
        public Conversation Conversation { get; set; }
        public long ConversationId { get; set; }
    }
}
