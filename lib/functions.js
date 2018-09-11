/**
 * 
 * @param {number} currentPage - current page user is on, expected to be higher than 0 and less or equal to pageCount
 * @param {number} uncountableMaxPages - number of pages to return, expected to be uncountable
 * and more than 4 to ensure you always can always access at least one page back and forward
 * @param {number} pageCount - total number of pages
 * @returns {Array} each elemnent is either page number or ellipsis(after first and before last page)
 */
function getPagesArray(currentPage, uncountableMaxPages, pageCount) {
    let arr = [];

    //if max pages is more than the number of available pages just return array with all pages, nothing is skipped
    if (uncountableMaxPages >= pageCount) {
      for(let i = 1; i <= pageCount; i++) {
        arr.push(i);
      }
      return arr;
    }

    //page 1 is always there
    arr.push(1);

    //get number of second page to use in loop
    //if current page is before or at the middle of all pagination buttons,
    //  use 2, i.e dont skip any pages between 1 and loop
    //else if current page doens't require skipping before final page, use as many pages as possible from the end
    //  e.g. current page-7, max-5, count-10 => pageNumber(10 - 5 + 2 = 7) 
    //  as we need the array return 1, 7(pageNumber),8,9,10
    //else we skip pages on both sides, show max - 2 pages between page 1 and page last
    //   with current page in the middle of it so theres the same amount of pages on the left and right of its
    //   e.g current page-6, max-5, count-10 => pageNumber(6-(3/2) = 1) => 1...5,6(pageNumber),7...10
    //   e.g current page-6, max-7, count-10 => pageNumber(6-(5/2) = 4) => 1...4,5,6(pageNumber),7,8...10
    let pageNumber;
    if (currentPage - Math.ceil(uncountableMaxPages / 2) <= 0) {
        pageNumber = 2;
    } else {
        if (currentPage + Math.ceil(uncountableMaxPages / 2) > pageCount) {
            pageNumber = pageCount - uncountableMaxPages + 2;
        } else {
            pageNumber = currentPage - Math.floor((uncountableMaxPages - 2) / 2);
        }
    }

    //if skipping pages add an empty element after first page in array
    if(pageNumber > 2) {
        arr.push("");
    }

    //loop max-1 times to fill all other page spaces
    //if on last page and and its less than final page, dont add it, add empty element and last page instead
    //else if we are on page that doens't exist, e.g. we need page 5 but there are only 4 pages, dont add, break loop
    //else add page
    for (let i = 0; i < uncountableMaxPages - 1; i++) {
        if (i === uncountableMaxPages - 2 && pageNumber < pageCount) {
            arr.push("");
            arr.push(pageCount);
            break;
        } else {
            if (pageNumber > pageCount) {
                break;
            } else {
                arr.push(pageNumber);
            }
        }
        pageNumber++;
    }
    return arr;
}

module.exports = {
    getPagesArray    
}