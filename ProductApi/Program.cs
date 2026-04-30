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
            new Product { Name = "Laptop", Price = 1200.99m, InventoryCount =  10, UserId = 1 },
            new Product {  Name = "Headphones", Price = 199.50m, InventoryCount = 5, UserId = 1 },
            new Product {  Name = "Keyboard", Price = 89.99m, InventoryCount = 20, UserId = 2 },
            new Product {  Name = "Monitor", Price = 89.99m, InventoryCount = 20, UserId = 2 }
        );

        db.SaveChanges();
    }

    if (!db.Users.Any())
    {
        db.Users.AddRange(
            new User {Id = 1, Email = "water@water.com", Password = "Password" },
            new User {Id = 2, Email = "egg@egg.com", Password = "Yolk" }
        );

        db.SaveChanges();
    }
}

/* ===================================================== */
/* HELPER METHOD FOR AUTH (HEADER-BASED LOGIN) */
/* ===================================================== */
User? GetUserFromHeader(HttpRequest request, ProductDb db)
{
    if (!request.Headers.TryGetValue("X-User-Email", out var email))
        return null;

    return db.Users.FirstOrDefault(u => u.Email == email);
}


/* ===================================================== */
/* PURCHASE ENDPOINT (NO CLAIMS, USE HEADER) */
/* ===================================================== */
app.MapPost("/purchases", (PurchaseRequest request, ProductDb db, HttpRequest http) =>
{
    var user = GetUserFromHeader(http, db); 

    if (user == null)
    {
        return Results.Unauthorized(); 
    }

    if (request.Quantity <= 0)
        return Results.BadRequest();

    var product = db.Products.Find(request.ProductId);

    if (product == null)
        return Results.NotFound();

    if (request.Quantity > product.InventoryCount)
        return Results.BadRequest();

    var purchase = new Purchase
    {
        ProductId = request.ProductId,
        Quantity = request.Quantity,
        UserId = user.Id 
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


/* ===================================================== */
/* CREATE PRODUCT (ASSIGN OWNER) */
/* ===================================================== */
app.MapPost("/products", async (HttpRequest request, Product product, ProductDb db) =>
{
    var user = GetUserFromHeader(request, db); 

    if (user == null)
    {
        return Results.Unauthorized(); 
    }

    product.UserId = user.Id; 

    db.Products.Add(product);
    await db.SaveChangesAsync();

    return Results.Created($"/products/{product.Id}", product);
});


/* ===================================================== */
/* EDIT PRODUCT (OWNER ONLY) */
/* ===================================================== */
app.MapPut("/products/{id}", async (int id, HttpRequest request, Product updated, ProductDb db) =>
{
    var user = GetUserFromHeader(request, db); 
    if (user == null) return Results.Unauthorized();

    var product = await db.Products.FindAsync(id);
    if (product == null) return Results.NotFound();

    if (product.UserId != user.Id) 
        return Results.Unauthorized();

    product.Name = updated.Name;
    product.Price = updated.Price;
    product.InventoryCount = updated.InventoryCount;

    await db.SaveChangesAsync();

    return Results.Ok(product);
});


/* ===================================================== */
/* DELETE PRODUCT + CASCADE PURCHASES */
/* ===================================================== */
app.MapDelete("/products/{id}", async (int id, HttpRequest request, ProductDb db) =>
{
    var user = GetUserFromHeader(request, db);
    if (user == null) return Results.Unauthorized();

    var product = await db.Products.FindAsync(id);
    if (product == null) return Results.NotFound();

    // Only owner can delete
    if (product.UserId != user.Id)
        return Results.Unauthorized();

    
    var relatedPurchases = db.Purchases
        .Where(p => p.ProductId == id)
        .ToList();

    db.Purchases.RemoveRange(relatedPurchases);

    // Then delete the product
    db.Products.Remove(product);

    await db.SaveChangesAsync();

    return Results.Ok();
});


/* ===================================================== */
/*  SELLER ORDERS */
/* ===================================================== */
app.MapGet("/seller/orders", (HttpRequest request, ProductDb db) =>
{
    var user = GetUserFromHeader(request, db);
    if (user == null) return Results.Unauthorized();

    var orders = db.Purchases
        .Include(p => p.Product)
        .Where(p => p.Product != null && p.Product!.UserId == user.Id)
        .Select(p => new
        {
            productName = p.Product!.Name,
            quantity = p.Quantity,
            unitPrice = p.Product!.Price,
            revenue = p.Product!.Price * p.Quantity
        })
        .ToList();

    var totalRevenue = orders.Sum(o => o.revenue);

    return Results.Ok(new
    {
        orders,
        totalRevenue
    });
});

/* ===================================================== */
/* BUYER ORDERS */
/* ===================================================== */
app.MapGet("/my/orders", (HttpRequest request, ProductDb db) =>
{
    var user = GetUserFromHeader(request, db);
    if (user == null) return Results.Unauthorized();

    var orders = db.Purchases
        .Include(p => p.Product)
        .Where(p => p.UserId == user.Id && p.Product != null)
        .Select(p => new
        {
            productName = p.Product!.Name,
            quantity = p.Quantity,
            total = p.Product!.Price * p.Quantity,
            createdAt = p.CreatedAt
        })
        .ToList();

    var totalSpent = orders.Sum(o => o.total);

    return Results.Ok(new
    {
        orders,
        totalSpent
    });
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