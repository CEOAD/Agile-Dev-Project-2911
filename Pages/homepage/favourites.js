
export let favs = document.getElementById("chosen");

export let cityArray = [
    {city: "Vancouver, BC, Canada", coord: {lat: 49.246292, lng: -123.116226}},
        {city: "London, UK", coord: {lat: 51.509865, lng: -0.118092}},
        {city: "Singapore", coord: {lat: 1.290270, lng: 103.851959}}
];

export function createLi (placeName){
    const newLi = document.createElement("li");
    const newSpan = document.createElement("span");
    const newDel = document.createElement("button");

    newSpan.textContent = placeName;
    newDel.textContent = "Del";
    newDel.classList.add("del");
    newLi.appendChild(newSpan);
    newLi.appendChild(newDel);
    return newLi
}

export function delBtn(event){
    if (event.target.tagName === "BUTTON"){
        for (let city of cityArray) {
            if (event.target.previousElementSibling.textContent.includes(city["city"])) {
                cityArray.splice(cityArray.indexOf(city), 1);
            }
        }
        event.currentTarget.removeChild(event.target.parentNode);
    }
}

export function addFav(event, marker){
    const searchQuery = document.querySelector("#search-input");
    if (event.target.id === "add"){
        if (cityArray.length >= 5){
            alert("Delete a favourite to add another one.")
            return;
        }

        for (let city of cityArray) {
            if (cityArray.find(x => x.city === searchQuery.value)) {
                alert("You already added that place.");
                searchQuery.value = "";
                return;
            }
        }

        if (event.target.id === "add"){
            if (searchQuery.value !== ""){
                let newLi = createLi(searchQuery.value);
                event.target.parentNode.appendChild(newLi);

                let newPosition = marker.getPosition();
                cityArray.push ({
                    city: searchQuery.value,
                    coord: newPosition
                })
                searchQuery.value = "";
            }
            else {
                alert("You have not entered a search.")
            }
        }
    }
}
