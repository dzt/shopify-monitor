const jsdiff = require('diff')
const _ = require('underscore')

// what works
// notification on new item: [x]
// notification on sold out item: [x]
// notification on restocked item: [x]
// notification on items removed from store [x]

// this is an example of comparing the shops stock before and after, pt_1 (before) and pt_2 (after)
var pt_1 = [
    '{"name": "Item 1", "status": "Available"}',
    '{"name": "Item 2", "status": "Available"}',
    '{"name": "Item 3", "status": "Available"}',
    '{"name": "Item 4", "status": "Available"}',
    '{"name": "Item 5", "status": "Available"}',
    '{"name": "Item 6", "status": "Available"}'
]

var pt_2 = [
    '{"name": "Item 1", "status": "Sold Out"}',
    '{"name": "Item 2", "status": "Available"}',
    '{"name": "Item 3", "status": "Sold Out"}',
    '{"name": "Item 4", "status": "Sold Out"}',
    '{"name": "Item 69", "status": "Available"}',
]

var testNewItems = []
var testRestockedItems = []
var testRemovedItems = []
var testSoldoutItems = []

var parsedOG = []
var parsedNew = []

for (var i = 0; i < pt_1.length; i++) {
    parsedOG.push(JSON.parse(pt_1[i]))
}

for (var i = 0; i < pt_2.length; i++) {
    parsedNew.push(JSON.parse(pt_2[i]))
}

var diffTest = jsdiff.diffArrays(pt_1, pt_2)

diffTest.forEach(function(part) {
    if (part.added) {
        var item
        var diffAdded = []

        for (var i = 0; i < part.value.length; i++) {
            diffAdded.push(JSON.parse(part.value[i]))
        }

        for (var i = 0; i < diffAdded.length; i++) {
            item = _.where(parsedOG, {
                name: diffAdded[i].name
            })
            if (item.length === 0) {
                // newly added item push to new items array
                testNewItems.push(diffAdded[i].name)
                console.log(`Item Added to Store: ${diffAdded[i].name}`)
            } else if (item.length > 0) {
                item = _.where(parsedOG, {
                    name: diffAdded[i].name
                })

                if (diffAdded[i].status === "Available" && item[0].status === "Sold Out") {
                    testRestockedItems.push(diffAdded[i])
                    console.log(`Restocked Item: ${diffAdded[i].name}`)
                }

                if (diffAdded[i].status === "Sold Out" && item[0].status === "Available") {
                    testSoldoutItems.push(diffAdded[i])
                    console.log(`Item Sold Out: ${diffAdded[i].name}`)
                }

            }
        }

    } else if (part.removed) {
        var diffRemoved = []
        for (var i = 0; i < part.value.length; i++) {
            diffRemoved.push(JSON.parse(part.value[i]))
        }

        for (var i = 0; i < diffRemoved.length; i++) {
            item = _.where(parsedNew, {
                name: diffRemoved[i].name
            })

            if (item.length === 0) {
              testRemovedItems.push(diffRemoved[i])
              console.log(`Item Removed from Store: ${parsedNew[i].name}`)
            }

        }

    }
});
