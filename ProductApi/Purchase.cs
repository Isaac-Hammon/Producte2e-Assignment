public class Purchase
{
    public int Id { get; set; }  // auto-increment by default in EF Core

    public int UserId { get; set; }
    public User? User { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int Quantity { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PurchaseRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public int UserId { get; set; }
}