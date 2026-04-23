using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

var MyAllowSpecificOrigins = "myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

// -------------------- SERVICES --------------------

builder.Services.AddDbContext<ProductDb>(options =>
{
	options.UseInMemoryDatabase("ProductDb");
});

builder.Services.AddAuthorization();

// ✅ CORS must be registered here (before Build)
builder.Services.AddCors(options =>
{
	options.AddPolicy(MyAllowSpecificOrigins, policy =>
	{
		policy.AllowAnyOrigin()
		      .AllowAnyMethod()
		      .AllowAnyHeader();
	});
});

// -------------------- BUILD APP --------------------

var app = builder.Build();

// -------------------- MIDDLEWARE --------------------

app.UseCors(MyAllowSpecificOrigins);
app.UseAuthorization();

// ------------------- Seed data -------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProductDb>();

    if (!db.Products.Any())
    {
        db.Products.AddRange(
            new Product { Name = "Laptop", Price = 1200.99m, InventoryCount = 10 },
            new Product { Name = "Headphones", Price = 199.50m, InventoryCount = 5 },
            new Product { Name = "Keyboard", Price = 89.99m, InventoryCount = 20 }
        );

        db.SaveChanges();
    }

    if (!db.Users.Any())
    {
        db.Users.Add(new User
        {
            Email = "water@water.com",
            Password = "password"
    });

        db.SaveChanges();
    }


}



// ✅ CORS (MOVED UP)
app.UseCors(MyAllowSpecificOrigins);

// ✅ AUTH (REQUIRED for [Authorize])

app.UseAuthorization();

app.MapPost("/purchases", (PurchaseRequest request, ProductDb db, HttpContext http) =>
{
    var userIdClaim = http.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

    // ✅ Cypress expects 401 when not logged in
    if (userIdClaim == null)
    {
        return Results.Unauthorized();
    }

    var userId = int.Parse(userIdClaim.Value);

    if (request.Quantity <= 0)
        return Results.BadRequest("Quantity must be greater than 0");

    var product = db.Products.Find(request.ProductId);

    if (product == null)
        return Results.NotFound();

    if (request.Quantity > product.InventoryCount)
        return Results.BadRequest("Not enough inventory");

    var purchase = new Purchase
    {
        ProductId = request.ProductId,
        Quantity = request.Quantity,
        UserId = userId
    };

    db.Purchases.Add(purchase);
    product.InventoryCount -= request.Quantity;

    db.SaveChanges();

    return Results.Ok(purchase);
});

// GET all products
app.MapGet("/products", async (ProductDb db) =>
    await db.Products.ToListAsync()
);

// CREATE product
app.MapPost("/products", async (HttpRequest request, Product product, ProductDb db) =>
{
    if (!request.Headers.TryGetValue("X-User-Email", out var userEmail) ||
        string.IsNullOrWhiteSpace(userEmail.ToString()))
    {
        return Results.BadRequest(new
        {
            message = "You must be logged in to create a product"
        });
    }

    db.Products.Add(product);
    await db.SaveChangesAsync();

    return Results.Created($"/products/{product.Id}", product);
});

// USERS
app.MapPost("/users", async (User user, ProductDb db) =>
{
    var existingUser = await db.Users
        .FirstOrDefaultAsync(u => u.Email == user.Email);

    if (existingUser != null)
    {
        return Results.BadRequest(new { message = "Email already exists" });
    }

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Ok(new { id = user.Id });
});

// LOGIN
app.MapPost("/login", async (User login, ProductDb db) =>
{
    var user = await db.Users
        .FirstOrDefaultAsync(u =>
            u.Email == login.Email &&
            u.Password == login.Password);

    if (user == null)
    {
        return Results.BadRequest(new { message = "Invalid credentials" });
    }

    return Results.Ok(new
    {
        id = user.Id,
        email = user.Email
    });
});

app.Run();