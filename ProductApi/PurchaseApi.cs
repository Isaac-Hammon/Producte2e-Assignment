using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/purchases")]
public class PurchaseApi : ControllerBase
{
    private readonly ProductDb _db;

    public PurchaseApi(ProductDb db)
    {
        _db = db;
    }

    [HttpPost]
    [Authorize]
    public IActionResult CreatePurchase(Purchase purchase)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
            return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        if (purchase.Quantity <= 0)
            return BadRequest("Quantity must be greater than 0");

        var product = _db.Products.Find(purchase.ProductId);

        if (product == null)
            return NotFound();

        if (purchase.Quantity > product.InventoryCount)
            return BadRequest("Not enough inventory");

        purchase.UserId = userId; // IMPORTANT: override client input

        _db.Purchases.Add(purchase);
        product.InventoryCount -= purchase.Quantity;

        _db.SaveChanges();

        return Ok(purchase);
    }
}