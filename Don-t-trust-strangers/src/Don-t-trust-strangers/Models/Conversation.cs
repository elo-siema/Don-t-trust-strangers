using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Don_t_trust_strangers.Models
{
    public class Conversation
    {
        public Conversation()
        {
            Messages = new List<Message>();
            Timestamp = DateTime.Now;
        }

        public Conversation(List<Message> messages)
        {
            Messages = messages;
            Timestamp = DateTime.Now;
        }

        [Key]
        public long ConversationId { get; set; }
        public DateTime Timestamp { get; set; }
        public List<Message> Messages { get; set; }
    }
}
