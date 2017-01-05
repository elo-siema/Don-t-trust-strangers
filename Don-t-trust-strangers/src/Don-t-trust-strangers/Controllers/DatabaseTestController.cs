using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Don_t_trust_strangers.DataAccess;
using Don_t_trust_strangers.Enums;
using Don_t_trust_strangers.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Don_t_trust_strangers.Controllers
{
    [Route("api/[controller]")]
    public class DatabaseTestController : Controller
    {
        private readonly DatabaseContext _context;

        public DatabaseTestController(DatabaseContext context)
        {
            _context = context;
        }

        // GET: api/values
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/values/5
        [HttpGet("{id}")]
        public string Get(long id)
        {
            return _context.Find<Message>(id).Content;
        }

        // POST api/values
        [HttpPost]
        public void Post([FromBody]string value)
        {
            var conversation = new Conversation();
            var message = new Message(MessageType.Message, "test wiadomości");
            message.Content = value;
            conversation.Messages.Add(message);
            _context.Add(conversation);
            _context.SaveChanges();
        }

        // PUT api/values/5
        [HttpPut("{id}")]
        public void Put(long id, [FromBody]string value)
        {
        }

        // DELETE api/values/5
        [HttpDelete("{id}")]
        public void Delete(long id)
        {
            _context.Remove(_context.Find<Message>(id));
        }
    }
}
