import React, { Component } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { Link } from 'react-router-dom'
export class Navbar extends Component {
  static contextType = ThemeContext;

  render() {
    const { darkMode, toggleDarkMode } = this.context;
    
    return (
      <div>
        <nav className={`navbar navbar-expand-lg ${darkMode ? 'navbar-dark bg-dark' : 'navbar-light bg-light'}`}>
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">NewsJackal</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                    <Link className="nav-link" aria-current="page" to="/">Home</Link>
                    </li>
                    <li className="nav-item">
                    <Link className="nav-link" to="/business">Business</Link>
                    </li>
                    <li className="nav-item">
                    <Link className="nav-link" to="/entertainment">Entertainment</Link>
                    </li>
                    <li className="nav-item">
                    <Link className="nav-link" to="/general">General</Link>
                    </li>
                    <li className="nav-item">
                    <Link className="nav-link" to="/health">Health</Link>
                    </li>
                    <li className="nav-item">
                    <Link className="nav-link" to="/science">Science</Link>
                    </li>
                    <li className="nav-item">
                    <Link className="nav-link" to="/sports">Sports</Link>
                    </li>
                    <li className="nav-item">
                    <Link className="nav-link" to="/technology">Technology</Link>
                    </li>
                </ul>
                <div className="d-flex">
                  <button 
                    className={`btn ${darkMode ? 'btn-light' : 'btn-dark'}`} 
                    onClick={toggleDarkMode}
                  >
                    {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                  </button>
                </div>
                </div>
            </div>
            </nav>
      </div>
    )
  }
}

export default Navbar
