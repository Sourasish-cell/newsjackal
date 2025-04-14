import React, { Component } from 'react'

export class Newsitem extends Component {
  render() {
    const { title, description, imageUrl, newsUrl, darkMode, author, date, source } = this.props;
    const fallbackImage = 'https://imgs.search.brave.com/oK32WQzuyvw5EUGknBtPc5RHacWFKXRKl-erDAUN_S8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTMx/MTE0ODg4NC92ZWN0/b3IvYWJzdHJhY3Qt/Z2xvYmUtYmFja2dy/b3VuZC5qcGc_cz02/MTJ4NjEyJnc9MCZr/PTIwJmM9OXJWUWZy/VUdOdFI1UTB5Z211/UTlqdmlWVWZybllI/VUhjZml3YUg1LVdG/RT0';
    
    return (
      <div className="h-100">
        <div className={`card h-100 ${darkMode ? 'bg-dark text-light' : ''}`} style={{ overflow: 'visible' }}>
          <div className="position-relative">
            <img src={imageUrl || "https://wallpapercave.com/wp/wp7939960.jpg"} className="card-img-top" alt={title} style={{ height: '200px', objectFit: 'cover' }}/>
            <span className="position-absolute top-0 end-0 badge rounded-pill bg-danger m-2" style={{ zIndex: '1' }}>
              {source} 
            </span>
          </div>
          <div className="card-body d-flex flex-column">
            <h5 className="card-title">{title}...</h5>
            <p className="card-text flex-grow-1">{description}...</p>
            <p className="card-text"><small className={darkMode ? 'text-light' : 'text-muted'}>By {!author?"Unknown": author} on {new Date(date).toGMTString()}</small></p>
            <a href={newsUrl} className={`btn ${darkMode ? 'btn-light' : 'btn-primary'} mt-auto`} target="_blank" rel="noopener noreferrer">Read More</a>
          </div>
        </div>
      </div>
    )
  }
}

export default Newsitem
