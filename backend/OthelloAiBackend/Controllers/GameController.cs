using Microsoft.AspNetCore.Mvc;

namespace OthelloAiBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase
    {
        [HttpPost]
        public IActionResult CreateGame()
        {
            // Plateau initial 8x8 vide (tableau jagged)
            string[][] board = new string[8][];
            for (int i = 0; i < 8; i++)
            {
                board[i] = new string[8];
            }

            var initialBoard = new
            {
                id = Guid.NewGuid(),
                board = board
            };

            return Ok(initialBoard);
        }

        [HttpGet("{id}")]
        public IActionResult GetGame(Guid id)
        {
            string[][] board = new string[8][];
            for (int i = 0; i < 8; i++)
            {
                board[i] = new string[8];
            }

            var game = new
            {
                id = id,
                board = board
            };

            return Ok(game);
        }

        [HttpPost("move")]
        public IActionResult PlayMove([FromBody] MoveDto move)
        {
            string[][] updatedBoard = new string[8][];
            for (int i = 0; i < 8; i++)
            {
                updatedBoard[i] = new string[8];
            }

            var result = new
            {
                id = move.Id,
                board = updatedBoard
            };

            return Ok(result);
        }
    }

    public class MoveDto
    {
        public Guid Id { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
    }
}
