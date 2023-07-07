const express = require("express");
const mongoose = require("mongoose");

const app = express();
//const date = require(__dirname + "/date.js")

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"))

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://admin-irene:admin@todolistdb.bhppps5.mongodb.net/todolistDB');
    const itemSchema = new mongoose.Schema({
        name: String
    })
    const Item = mongoose.model("item", itemSchema);
    const item1 = new Item({name: "Welcome to your todolist!"});
    const item2 = new Item({name: "Hit the + button to add a new item."});
    const item3 = new Item({name: "<-- Hit this to delete an item."});
    const defaultItems = [item1, item2, item3];

    const listSchema = {
        name: String,
        items: [itemSchema]
    }
    const List = mongoose.model("List", listSchema);

    app.get("/", async function(req, res){
        //let day = date.getDay();
        try {
            // await the result of the query
            const items = await Item.find().exec(); // <-- await here
            if (items.length == 0){
                await Item.insertMany(defaultItems);
                res.redirect("/");
            } else {
                res.render('list', {listTitle: "Today", newListItems: items});
            } 
        } catch (err) {
            console.error('Error retrieving items:', err);
            res.status(500).send('Server error');
        }
    });
    
    //Express Route Parameters

    app.get("/:customListName", async function (req, res){
        const customListName = req.params.customListName;
        let list = await List.findOne({name: customListName}).exec();
        if (!list){
            list = new List({
                name: customListName,
                items: defaultItems
            })
            list.save();
        }
        res.render("list", {listTitle: list.name, newListItems: list.items});
    });

    app.post("/", async function(req, res){
        const itemName = req.body.newItem;
        const listName = req.body.list;
        console.log(listName);
        const item = new Item({name: itemName});
        if (listName === "Today"){
            await item.save();
            res.redirect("/");
        } else {
            let list = await List.findOne({name: listName}).exec();
            if (list) {
                list.items.push(item);
                await list.save(); // Wait for the list to be updated
                res.redirect("/" + listName);
                console.log(list);
            } else {
                console.log(`List not found: ${listName}`);
                res.redirect("/");
            }
        }
    });

    app.post("/delete", async function(req, res){
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName;

        if(listName === "Today"){
            await Item.deleteOne({_id: checkedItemId});
            res.redirect("/");
        } else {
            let list = await List.findOne({name: listName}).exec();
            list.items.pull({_id: checkedItemId});
            await list.save();
            res.redirect("/" + listName);
        }
    });
}


app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port 3000");
});