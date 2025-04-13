import './App.css';
import Navbar from './Components/Navbar';
import News from './Components/News';
import React, { Component } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoadingBar from "react-top-loading-bar";

export default class App extends Component {
  pageSize = 15;

  state = {
    progress: 0
  };

  setProgress = (progress) => {
    this.setState({ progress: progress });
  };

  componentDidMount() {
    console.log("App component mounted");
  }

  render() {
    console.log("App component rendering");
    return (
      <ThemeProvider>
        <div>
          <Router>
            <Navbar />
            <LoadingBar
              color="#f11946"
              progress={this.state.progress}
            />
            <div className="container">
              <Routes>
                <Route path="/" element={<News pageSize={this.pageSize} category="general" setProgress={this.setProgress} />} />
                <Route path="/business" element={<News pageSize={this.pageSize} category="business" setProgress={this.setProgress} />} />
                <Route path="/entertainment" element={<News pageSize={this.pageSize} category="entertainment" setProgress={this.setProgress} />} />
                <Route path="/general" element={<News pageSize={this.pageSize} category="general" setProgress={this.setProgress} />} />
                <Route path="/health" element={<News pageSize={this.pageSize} category="health" setProgress={this.setProgress} />} />
                <Route path="/science" element={<News pageSize={this.pageSize} category="science" setProgress={this.setProgress} />} />
                <Route path="/sports" element={<News pageSize={this.pageSize} category="sports" setProgress={this.setProgress} />} />
                <Route path="/technology" element={<News pageSize={this.pageSize} category="technology" setProgress={this.setProgress} />} />
              </Routes>
            </div>
          </Router>
        </div>
      </ThemeProvider>
    );
  }
}

