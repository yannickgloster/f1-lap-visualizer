# CS7DS4 Assignment 3

Yannick Gloster (18308167)

<aside>
📝 **DECLARATION**: I understand that this is an individual assessment and that collaboration is not permitted. I have read and understood the plagiarism provisions in the General Regulations of the University Calendar for the current year, found at [http://www.tcd.ie/calendar](http://www.tcd.ie/calendar). I understand that by returning this declaration with my work, I am agreeing with the above statement.

</aside>

# The Dataset

I chose to visualize Formula One races thanks to the Ergast API [[0]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20). The Ergast API provides historical records for non-commercial purposes of Formula One races going back to the original world championships in 1950. The API provides lap timings from 1996 onwards which is the core of my application.

Users select any year from 1996 onwards. Once selected, I query the Ergast API to get the list of races in that year. From the API, I get the round number, date, time, circuit name, and Wikipedia link to the event. The data

Using the round number I make an API request for the final results, the lap data for the race, and the constructor (in Formula One, teams are referred to as constructors [[1]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20)) information for that race. The data is comprised of multiple tables connected through IDs.

While the dataset is quite large, I focused on and used a small part of the dataset in order to show information that the user was interested in without overwhelming them.

From the results API, I use the starting position of the driver, the finishing position of the driver, the driver ID (to match against the other requests), the permanent driver number (since 2014), the three-letter unique driver code (typically based off driver’s last name), the full name of the driver, the date of birth, the constructor name and the nationalities of both the driver and the constructor. These were used for the legend and the tooltips to provide informative information on the driver. All the data points except for the finishing position are categorical while the finishing position is quantitative and continuous.

The constructor information provided the same constructor information as in the results API but helped bring logic to the data handling.

The lap data consisted of every lap, the lap speed of each driver, and their current position. The lap speed was formatted in minute(s):second(s).milliseconds. The lap speed and current position were both continuous and quantitative. This is the primary visual representation of the data.

In order to display the flags from the nationalities, I used a slightly modified publicly available list [[2]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20) which contained the nationality string as well as the ISO country code.

Constructors also typically have a color associated with themselves that is unique, however, these colors change year on year and there does not exist a list of unique colors. I went through every constructor since 1996 and using their Wikipedia pages and other resources, created a list of colors that Formula One fans could recognize and that could be distinct enough for non Formula One fans.

# Tools & Technologies

## Pre-Processing Data

I was looking to visualize how a race evolved over time and while I had the precise lap speed per lap and their position, I needed to parse the lap time into a total number of seconds and keep track of the elapsed time from the start. A driver might have a very fast lap, but may be last position and a significant distance away from the driver in front. I wrote a small parsing library to convert back and forth this time variable.

The lap data did not include the starting positions either, using the starting grid position from the results data set, I estimated the relative time difference between each driver. Grid spots are $8 \text{m}$ apart [[3]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20) and F1 cars have an average acceleration of $\approx11.1\text{m}/\text{s}^2$ to $100\text{km}/\text{h}$ [[4]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20) therefore it would take $\sqrt2*8\text{m}/(11.1 \text{m}/\text{s}^2)\approx 1.2\text{s}$. This generated data is added to the very front of the list of lap data.

As my application interacts with the API, I created a fallback for the data where regardless of the status of the API, the first two races of 2021 and 2022 can be visualized. I created a script (`pages\api\fallback\generate.js`) that generated an offline copy of the data (`helpers\apiFallback.js`). When the frontend detects a problem with the status of the Ergast API, it switches to an internal endpoint that serves the data in the way the original API does (`pages\api\fallback\[...fallback].js``).

## Tools & Technology

The visualization is built as a web app using Next.js [[5]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20), a powerful React and Javascript framework allowing for hybrid static and server-side rendering as well as the creation of serverless API routes.

The autocomplete dropdowns, buttons, and text elements are all handled by Material UI [[6]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20), a component library built off of the Google Material Design standard.

The visualization itself is an interactive SVG built using D3.Js [[7]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20) and Framer Motion [[8]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20). D3 was used when scaling the data and mapping the data to x and y positions in the SVG. Framer Motion is an animation library for React that animated the movement of the elements and interpolated the position. The tooltips and legends were built using Material UI.

The artifact is hosted for free through Vercel [[9]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20) and should be available in perpetuity.

# Tasks

The users of the visualization will be able to watch an entire Formula One race while seeing the relative position of drivers next to each other. Typically, a person will watch Formula 1 as a TV broadcast where the focus is on whatever Driver the camera feed is being focused on, by engaging in the race through my visualizer, they can better see the relative position of all the drivers. This falls under the **analysis** action. If someone has not watched one of the races before, they will get to discover and explore how drivers performed. If they have watched the race, they will get to enjoy the race from a new perspective.

The user gets to select the year, race, and specific lap. They can **search** and **\*query** for specific laps and look at the lap times of each driver. Given that there exists two tooltips, a hover tooltip, and a permanent on-click tooltip, a user can compare the lap times of two drivers at any point in time. The user can also compare the relative position of a driver over time by watching how one of the points moves over time.

Users can also compare how teammates driving for the same constructor compare. Driving for the same constructor generally indicates that they are in nearly identical cars, therefore, allowing for a user to draw performance comparisons between drivers.

Users can also compare lap times at tracks over years. Sometimes, the same track is used for many years in a row and a user can see how the development of cars over the decades changed the performance.

There certainly exists more tasks that a user can interact with, however, these were the ones that I specifically was targeting. Other tasks will and do exist as a byproduct of the visualization tools I’ve built and the complexity of the data.

# Encoding Channels & Idioms

The specific race is selected by using two dropdowns; selecting the year and the race from the list of races in that year. The user can also use a textbox to select what lap they want to look at.

Each car is represented by a circle with a stroke around it to provide contrast with the white background. The color of the circle represents the constructor. Color and livery design is the traditional way that you recognize each unique constructor. Given that livery only works in much larger form factors, color is the perfect choice to identify the constructors. Unique colors are also used in the official TV broadcast for the timings board to quickly identify constructors.

Individual drivers are identified by either their 3 letter driver code (typically derived from their last name) and/or their permanent driver number. Permanent driver numbers were only introduced in 2014 and therefore any driver who did not participate in the 2014 season to present does not have a permanent driver number. The 3 letter driver code is always unique and does not expire, while the driver numbers are unique but are only tied to a driver for 2 years after their most recent race. The driver code appears in the center of the circle, with white or black text depending on the constructor color to allow for good contrast. If a driver has a driver number, this number is displayed underneath the driver code in smaller text.

The constructors and drivers have a legend where the constructor is labeled next to their color and each driver for the constructor is listed underneath with their 3 letter driver code next to their full name. This allows for a quick matching between the driver and their team as a user can filter down to two drivers per color and look at their driver code. If a driver is not allowed to participate in a race, the reason is written next to their name.

The drivers are plotted linearly with their position being their relative time gap to the leader on that lap. There is an axis plot with 8 ticks which scale as the drivers spread apart from each other. In the background, between every other set of ticks, there is a darker pattern allowing for a user to easily see that a driver is between two times.

When the user hovers over a driver, it shows the current position, the gap to the leader, and their current lap time. It also shows details on the driver including their name, nationality, time at the race, what constructor they drive for, and the nationality of the constructor. This allows for a user to get more in-depth information on a specific driver. Next to the name of the driver, there is a driver helmet icon to help identify that this is the driver. Next to the name of the constructor, there exists a car icon in the constructor color to identify the text as the constructor name. Constructors and drivers both race under separate nationalities, the nationalities are listed with their associated flags so that users quickly can determine the nationality. The tooltip also naturally appears next to the cursor.

If the user clicks on a driver, a little red dot appears over the element indicating that it has been selected. On the right-hand side of the chart, the information on the driver’s current position, gap to the leader, and current lap time are permanently displayed and updated to match the information of the current lap.

Underneath the linear plot, there is a box where retired or lapped drivers are located. If a driver crashes, has an engine problem, or for some other reason has to retire, they are put into that box. At the end of the race, if the person in first has lapped cars, the lapped cars finish on the lap of the person in first and do not finish all their laps. Their tooltips include a status on why they have been put into the box. Including this information took some data processing as they are excluded from the lap data and it would be confusing to users if they just disappeared from the visualizer with no explanation.

In order to visualize the race over time, there is a play/pause button that increases the lap every second which animates the movement of the drivers relative to each other. It also automatically rescales the graph to adapt to the new distance between the driver in first and the driver in last.

# Novelty and Complexity

As far as I am aware, visualizing a Formula One race in a one-dimensional plot, such as this one, has not been done before. As technology regarding Formula One has increased in the last decade, visualizing on a 2d plot where you can see the actual car position on a track [[10]](https://www.notion.so/CS7DS4-Assignment-3-729c02650a394ed588d67b3235a2ff20) has become popular but it can be hard to understand the relative times and distances between cars if a user is unfamiliar with a track. My visualization standardizes this by plotting the drivers one-dimensionally.

The visualization is built entirely from scratch (1,500+ lines of code) and is fairly performant. Interacting with mostly CSS and SVG components allows for little bloat when loading elements for the user.

As the visualization pull directly from the API, as future races take place, this data will be able to be automatically visualized. Nonetheless, the visualization will always work due to the backup system I built. This system was built due to an outage during development and a fear that this could happen again but add robustness to the entire application.

# Critical Analysis

As mentioned previously, the visualization allows for a unique display of information that should be understandable by people who do not already watch Formula One. A user is able to watch and understand a majority of what happened in a Formula One race in a short period of time (under 2 minutes for all races).

Determining individual drivers and tracking their relative performance is straightforward and intuitive.

Unfortunately, many constructors have liked to use similar colors and were not forced to be more unique in older days, therefore there are constructor colors that are relatively similar and not distinct. This can make it hard to quickly see which car is what. For example, Ferrari red, Sauber red, and Virgin red from 2010. The single colors don’t also reflect the real colors of the constructor at that time as I selected the colors based on their most recognizable car. This introduces bias into the visualization.

There is also a plethora of information lost through the visualization of the Formula One race, not including pit stops, details on crashes, safety cars, yellow flags (indications to slow down due to an incident or debris), red flags (stop racing), race restarts, and more.

In older years, cars at the back of the pack could be significantly far away from the pack or those at the front could be very far away from those at the back or middle. This can make the chart hard to read, having some sort of zoom/scale could help alleviate these issues.

The visualization is also not unit tested in any way and therefore, it sometimes breaks changing the year and round too much. I’m not sure why and have not found the source of this (or these) bug(s) but a refresh of the page fixes these issues.

The visualization also does not scale well to smaller viewports such as phones.

# Artifact

[F1 Visualization](https://f1-visualization.vercel.app/)

# Source Code

[https://github.com/yannickgloster/f1-lap-visualizer](https://github.com/yannickgloster/f1-lap-visualizer)

# Image

![Untitled](/report/CS7DS4%20Assignment%203%20Report/Untitled.png)

# References

[0] _Ergast API_, Chris Newell, [http://ergast.com/mrd](http://ergast.com/mrd).

[1] “Formula One: Constructors.” _Wikipedia_, Wikimedia Foundation, 11 Dec. 2022, [https://en.wikipedia.org/wiki/Formula_One#Constructors](https://en.wikipedia.org/wiki/Formula_One#Constructors).

[2] Dinuks. “Dinuks/Country-Nationality-List: ISO 3166-1 Country + Nationality Listing in Multiple Formats.” _GitHub_, [https://github.com/Dinuks/country-nationality-list](https://github.com/Dinuks/country-nationality-list).

[3] “2021 Formula One Sporting Regulations.” _Fédération Internationale De l’Automobile_ , Fédération Internationale De l’Automobile , 16 Dec. 2020, [https://www.fia.com/sites/default/files/2021*formula_1_sporting_regulations*-\_iss_11-\_2021-07-12.pdf](https://www.fia.com/sites/default/files/2021_formula_1_sporting_regulations_-_iss_11-_2021-07-12.pdf).

[4] “Formula One Car.” _Wikipedia_, Wikimedia Foundation, 10 Dec. 2022, [https://en.wikipedia.org/wiki/Formula_One_car](https://en.wikipedia.org/wiki/Formula_One_car).

[5] “Next.js by Vercel - the REACT Framework.” _By Vercel - The React Framework_, [https://nextjs.org/](https://nextjs.org/).

[6] “The React Component Library You Always Wanted.” _MUI_, [https://mui.com/](https://mui.com/).

[7] Bostock, Mike. “Data-Driven Documents.” _D3.Js_, [https://d3js.org/](https://d3js.org/).

[8] “Framer Motion.” _Production-Ready Animation Library for React_, [https://www.framer.com/motion/](https://www.framer.com/motion/).

[9] “Develop. Preview. Ship. for the Best Frontend Teams.” _Vercel_, [https://vercel.com/](https://vercel.com/).

[10] “Live Timing.” _Formula 1 - The Official F1 Website_, [https://www.formula1.com/en/f1-live.html](https://www.formula1.com/en/f1-live.html).
