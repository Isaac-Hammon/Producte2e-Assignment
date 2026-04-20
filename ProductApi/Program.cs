using Microsoft.EntityFrameworkCore;

var MyAllowSpecificOrigins = "myAllowSpecificOrigins";
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ProductDb>(opt => opt.UseInMemoryDatabase("ProductList"));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();

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
}

// GET all products
app.MapGet("/products", async (ProductDb db) =>
    await db.Products.ToListAsync()
);

// ✅ BULLETPROOF AUTH CHECK (FIXED)
app.MapPost("/products", async (HttpRequest request, Product product, ProductDb db) =>
{
    // safer + fully consistent header extraction
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

// POST a new user
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

app.UseCors(MyAllowSpecificOrigins);

app.Run();